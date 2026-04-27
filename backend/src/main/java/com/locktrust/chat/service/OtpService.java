package com.locktrust.chat.service;

import com.locktrust.chat.model.OtpToken;
import com.locktrust.chat.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes}")
    private int expiryMinutes;

    @Transactional
    public String generateAndSendOtp(String email, String purpose) {
        otpTokenRepository.invalidateAllForEmailAndPurpose(email, purpose);

        String otp = "123456";
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .build();
        otpTokenRepository.save(token);
        emailService.sendOtp(email, otp, purpose);
        return otp;
    }

    @Transactional
    public boolean verifyOtp(String email, String otp, String purpose) {
        Optional<OtpToken> tokenOpt = otpTokenRepository
                .findTopByEmailAndPurposeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        email, purpose, LocalDateTime.now());

        if (tokenOpt.isEmpty()) return false;
        OtpToken token = tokenOpt.get();
        if (!token.getOtp().equals(otp)) return false;

        token.setUsed(true);
        otpTokenRepository.save(token);
        return true;
    }
}
