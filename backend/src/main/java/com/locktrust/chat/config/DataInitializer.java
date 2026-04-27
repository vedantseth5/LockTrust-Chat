package com.locktrust.chat.config;

import com.locktrust.chat.model.User;
import com.locktrust.chat.model.UserStatus;
import com.locktrust.chat.repository.UserRepository;
import com.locktrust.chat.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserStatusRepository userStatusRepository;

    // Admin login phone — use OTP 123456 to sign in
    private static final String ADMIN_PHONE = "+10000000000";
    private static final String ADMIN_EMAIL = "admin@locktrust.com";

    @Override
    @Transactional
    public void run(String... args) {
        User admin = userRepository.findByPhone(ADMIN_PHONE).orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .phone(ADMIN_PHONE)
                    .email(ADMIN_EMAIL)
                    .displayName("Admin")
                    .role("ADMIN")
                    .avatarColor("#EF5350")
                    .verified(true)
                    .build();
            admin = userRepository.save(admin);

            UserStatus status = UserStatus.builder().user(admin).presence("OFFLINE").build();
            userStatusRepository.save(status);

            log.info("Admin user created — phone: {}", ADMIN_PHONE);
        } else if (!"ADMIN".equals(admin.getRole())) {
            admin.setRole("ADMIN");
            admin.setVerified(true);
            userRepository.save(admin);
            log.info("Admin role corrected for: {}", ADMIN_PHONE);
        }

        log.info("=================================================");
        log.info("  LockTrust Chat initialized.");
        log.info("  Admin phone: {}  (OTP: 123456)", ADMIN_PHONE);
        log.info("  Backend: http://localhost:8080");
        log.info("=================================================");
    }
}
