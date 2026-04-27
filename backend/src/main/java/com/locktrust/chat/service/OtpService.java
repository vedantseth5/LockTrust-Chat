package com.locktrust.chat.service;

import com.locktrust.chat.model.OtpToken;
import com.locktrust.chat.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;

    @Value("${app.otp.expiry-minutes}")
    private int expiryMinutes;

    @Transactional
    public void generateAndSendOtp(String phone, String purpose) {
        otpTokenRepository.invalidateAllForPhoneAndPurpose(phone, purpose);

        String otp = "123456";
        OtpToken token = OtpToken.builder()
                .phone(phone)
                .otp(otp)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .build();
        otpTokenRepository.save(token);
        log.info("[DEV] OTP for {} ({}): {}", phone, purpose, otp);
    }

    @Transactional
    public boolean verifyOtp(String phone, String otp, String purpose) {
        Optional<OtpToken> tokenOpt = otpTokenRepository
                .findTopByPhoneAndPurposeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        phone, purpose, LocalDateTime.now());

        if (tokenOpt.isEmpty()) return false;
        OtpToken token = tokenOpt.get();
        if (!token.getOtp().equals(otp)) return false;

        token.setUsed(true);
        otpTokenRepository.save(token);
        return true;
    }
}
