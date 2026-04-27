package com.locktrust.chat.service;

import com.locktrust.chat.dto.request.LoginRequest;
import com.locktrust.chat.dto.request.OtpVerifyRequest;
import com.locktrust.chat.dto.request.SignupRequest;
import com.locktrust.chat.dto.response.AuthResponse;
import com.locktrust.chat.dto.response.UserResponse;
import com.locktrust.chat.model.User;
import com.locktrust.chat.model.UserStatus;
import com.locktrust.chat.repository.UserRepository;
import com.locktrust.chat.repository.UserStatusRepository;
import com.locktrust.chat.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserStatusRepository userStatusRepository;
    private final OtpService otpService;
    private final JwtTokenProvider jwtTokenProvider;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String[] AVATAR_COLORS = {
        "#0099CC", "#00B8D4", "#26A69A", "#42A5F5",
        "#7E57C2", "#EC407A", "#EF5350", "#FF7043",
        "#8D6E63", "#78909C"
    };

    private String buildPhone(String countryCode, String phoneNumber) {
        String cc = countryCode.trim();
        String num = phoneNumber.trim().replaceAll("[^0-9]", "");
        if (!cc.startsWith("+")) cc = "+" + cc;
        return cc + num;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String phone = buildPhone(request.getCountryCode(), request.getPhoneNumber());

        if (userRepository.existsByPhone(phone)) {
            User existing = userRepository.findByPhone(phone).get();
            if (existing.getVerified()) {
                throw new RuntimeException("Phone already registered. Please login.");
            }
            otpService.generateAndSendOtp(phone, "SIGNUP");
            return new AuthResponse("OTP resent. Check the backend logs (dev mode).");
        }

        // Validate email uniqueness if provided
        String email = (request.getEmail() != null && !request.getEmail().isBlank())
                ? request.getEmail().trim() : null;
        if (email != null && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use.");
        }

        String color = AVATAR_COLORS[(int)(System.currentTimeMillis() % AVATAR_COLORS.length)];
        User user = User.builder()
                .phone(phone)
                .email(email)
                .displayName(request.getDisplayName())
                .avatarColor(color)
                .verified(false)
                .build();
        user = userRepository.save(user);

        UserStatus status = UserStatus.builder().user(user).presence("OFFLINE").build();
        userStatusRepository.save(status);

        otpService.generateAndSendOtp(phone, "SIGNUP");
        return new AuthResponse("OTP sent. Check the backend logs (dev mode).");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String phone = buildPhone(request.getCountryCode(), request.getPhoneNumber());
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("No account found for this number. Please sign up first."));
        if (!user.getVerified()) {
            throw new RuntimeException("Account not verified. Please complete signup first.");
        }
        otpService.generateAndSendOtp(phone, "LOGIN");
        return new AuthResponse("OTP sent. Check the backend logs (dev mode).");
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        String phone = request.getPhone();

        boolean valid = otpService.verifyOtp(phone, request.getOtp(), request.getPurpose());
        if (!valid) {
            throw new RuntimeException("Invalid or expired OTP.");
        }

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if ("SIGNUP".equals(request.getPurpose())) {
            user.setVerified(true);
            user = userRepository.save(user);

            Map<String, Object> event = new HashMap<>();
            event.put("type", "USER_NEW");
            event.put("payload", UserResponse.from(user));
            messagingTemplate.convertAndSend("/topic/workspace/users", event);
        }

        String token = jwtTokenProvider.generateAccessToken(user.getPhone(), user.getId());
        return new AuthResponse(token, UserResponse.from(user), "Authentication successful.");
    }
}
