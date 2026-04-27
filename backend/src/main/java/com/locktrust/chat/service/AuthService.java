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

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            User existing = userRepository.findByEmail(request.getEmail()).get();
            if (existing.getVerified()) {
                throw new RuntimeException("Email already registered. Please login.");
            }
            otpService.generateAndSendOtp(request.getEmail(), "SIGNUP");
            return new AuthResponse("OTP resent. Please check your email (or server logs in dev mode).");
        }

        String color = AVATAR_COLORS[(int)(System.currentTimeMillis() % AVATAR_COLORS.length)];
        User user = User.builder()
                .email(request.getEmail())
                .displayName(request.getDisplayName())
                .avatarColor(color)
                .verified(false)
                .build();
        user = userRepository.save(user);

        UserStatus status = UserStatus.builder().user(user).presence("OFFLINE").build();
        userStatusRepository.save(status);

        otpService.generateAndSendOtp(request.getEmail(), "SIGNUP");
        return new AuthResponse("OTP sent. Please check your email (or server logs in dev mode).");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found with this email. Please signup first."));
        if (!user.getVerified()) {
            throw new RuntimeException("Account not verified. Please complete signup first.");
        }
        otpService.generateAndSendOtp(request.getEmail(), "LOGIN");
        return new AuthResponse("OTP sent. Please check your email (or server logs in dev mode).");
    }

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp(), request.getPurpose());
        if (!valid) {
            throw new RuntimeException("Invalid or expired OTP.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found."));

        if ("SIGNUP".equals(request.getPurpose())) {
            user.setVerified(true);
            user = userRepository.save(user);

            // Broadcast new user to all connected clients so their user lists update
            Map<String, Object> event = new HashMap<>();
            event.put("type", "USER_NEW");
            event.put("payload", UserResponse.from(user));
            messagingTemplate.convertAndSend("/topic/workspace/users", event);
        }

        String token = jwtTokenProvider.generateAccessToken(user.getEmail(), user.getId());
        return new AuthResponse(token, UserResponse.from(user), "Authentication successful.");
    }
}
