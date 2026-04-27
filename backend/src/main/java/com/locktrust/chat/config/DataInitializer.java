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

    @Override
    @Transactional
    public void run(String... args) {
        String adminEmail = "admin@locktrust.com";
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        if (admin == null) {
            admin = User.builder()
                    .email(adminEmail)
                    .displayName("Admin")
                    .role("ADMIN")
                    .avatarColor("#EF5350")
                    .verified(true)
                    .build();
            admin = userRepository.save(admin);

            UserStatus status = UserStatus.builder().user(admin).presence("OFFLINE").build();
            userStatusRepository.save(status);

            log.info("Admin user created: {}", adminEmail);
        } else if (!"ADMIN".equals(admin.getRole())) {
            admin.setRole("ADMIN");
            admin.setVerified(true);
            userRepository.save(admin);
            log.info("Admin user role corrected: {}", adminEmail);
        }

        log.info("=================================================");
        log.info("  LockTrust Chat initialized.");
        log.info("  Backend running at: http://localhost:8080");
        log.info("  H2 Console: http://localhost:8080/h2-console");
        log.info("=================================================");
    }
}
