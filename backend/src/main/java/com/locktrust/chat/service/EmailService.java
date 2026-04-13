package com.locktrust.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    /**
     * Sends an OTP email. In dev mode (no real SMTP), logs OTP to console.
     * When a real mailbox is connected, replace this with actual JavaMailSender logic.
     */
    public void sendOtp(String toEmail, String otp, String purpose) {
        // TODO: connect real mailbox — replace log with JavaMailSender
        log.info("=================================================");
        log.info("  EMAIL TO: {}", toEmail);
        log.info("  PURPOSE:  {}", purpose);
        log.info("  OTP CODE: {}", otp);
        log.info("  (Copy this OTP to verify in the frontend)");
        log.info("=================================================");
    }
}
