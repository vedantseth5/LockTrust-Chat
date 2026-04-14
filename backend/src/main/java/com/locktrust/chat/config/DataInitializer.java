package com.locktrust.chat.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) {
        log.info("=================================================");
        log.info("  LockTrust Chat initialized.");
        log.info("  Backend running at: http://localhost:8080");
        log.info("  H2 Console: http://localhost:8080/h2-console");
        log.info("=================================================");
    }
}
