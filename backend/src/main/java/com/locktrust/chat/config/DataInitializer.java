package com.locktrust.chat.config;

import com.locktrust.chat.model.Channel;
import com.locktrust.chat.model.User;
import com.locktrust.chat.model.UserStatus;
import com.locktrust.chat.repository.ChannelRepository;
import com.locktrust.chat.repository.UserRepository;
import com.locktrust.chat.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserStatusRepository userStatusRepository;
    private final ChannelRepository channelRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Create system/bot user
        User system = User.builder()
                .email("system@locktrust.io")
                .displayName("LockTrust")
                .role("ADMIN")
                .avatarColor("#0099CC")
                .verified(true)
                .build();
        system = userRepository.save(system);
        userStatusRepository.save(UserStatus.builder().user(system).presence("ONLINE").build());

        // Create default channels
        createChannel("general", "Company-wide announcements and general discussion", system);
        createChannel("random", "Non-work banter and fun stuff", system);
        createChannel("engineering", "Engineering team discussions", system);
        createChannel("product", "Product roadmap and feedback", system);

        log.info("=================================================");
        log.info("  LockTrust Chat initialized.");
        log.info("  Default channels: #general, #random, #engineering, #product");
        log.info("  Backend running at: http://localhost:8080");
        log.info("  H2 Console: http://localhost:8080/h2-console");
        log.info("=================================================");
    }

    private Channel createChannel(String name, String description, User creator) {
        if (channelRepository.existsByName(name)) return channelRepository.findByName(name).get();
        Channel channel = Channel.builder()
                .name(name)
                .description(description)
                .isPrivate(false)
                .createdBy(creator)
                .build();
        channel.getMembers().add(creator);
        return channelRepository.save(channel);
    }
}
