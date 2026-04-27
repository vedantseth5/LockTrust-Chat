package com.locktrust.chat.service;

import com.locktrust.chat.dto.request.UpdateStatusRequest;
import com.locktrust.chat.dto.request.UpdateProfileRequest;
import com.locktrust.chat.dto.response.UserResponse;
import com.locktrust.chat.model.User;
import com.locktrust.chat.model.UserStatus;
import com.locktrust.chat.repository.UserRepository;
import com.locktrust.chat.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserStatusRepository userStatusRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public User getByPhone(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found: " + phone));
    }

    // kept for callers that pass principal.getUsername() which is always phone
    public User getByIdentifier(String phone) {
        return getByPhone(phone);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(User::getVerified)
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public List<UserResponse> searchUsers(String query) {
        return userRepository.searchUsers(query).stream()
                .filter(User::getVerified)
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateProfile(String phone, UpdateProfileRequest request) {
        User user = getByPhone(phone);
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank())
            user.setDisplayName(request.getDisplayName());
        if (request.getEmail() != null) {
            String email = request.getEmail().trim();
            if (email.isEmpty()) {
                user.setEmail(null);
            } else {
                userRepository.findByEmail(email)
                        .filter(existing -> !existing.getId().equals(user.getId()))
                        .ifPresent(existing -> { throw new RuntimeException("Email already in use."); });
                user.setEmail(email);
            }
        }
        if (request.getTitle() != null) user.setTitle(request.getTitle());
        if (request.getTimezone() != null) user.setTimezone(request.getTimezone());
        if (request.getAvatarColor() != null) user.setAvatarColor(request.getAvatarColor());
        userRepository.save(user);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateStatus(String phone, UpdateStatusRequest request) {
        User user = getByPhone(phone);
        UserStatus status = userStatusRepository.findById(user.getId())
                .orElse(UserStatus.builder().user(user).build());

        if (request.getPresence() != null) status.setPresence(request.getPresence());
        if (request.getCustomMessage() != null) status.setCustomMessage(request.getCustomMessage());
        status.setUpdatedAt(LocalDateTime.now());
        status = userStatusRepository.save(status);
        user.setStatus(status);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "PRESENCE_UPDATE");
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", user.getId());
        payload.put("presence", status.getPresence());
        payload.put("customMessage", status.getCustomMessage());
        event.put("payload", payload);
        messagingTemplate.convertAndSend("/topic/workspace/presence", event);

        return UserResponse.from(user);
    }

    @Transactional
    public void setUserOnline(String phone) {
        try {
            User user = getByPhone(phone);
            UserStatus status = userStatusRepository.findById(user.getId())
                    .orElse(UserStatus.builder().user(user).build());
            status.setPresence("ONLINE");
            status.setUpdatedAt(LocalDateTime.now());
            userStatusRepository.save(status);
            broadcastPresence(user.getId(), "ONLINE", status.getCustomMessage());
        } catch (Exception ignored) {}
    }

    @Transactional
    public void setUserOffline(String phone) {
        try {
            User user = getByPhone(phone);
            UserStatus status = userStatusRepository.findById(user.getId())
                    .orElse(UserStatus.builder().user(user).build());
            status.setPresence("OFFLINE");
            status.setUpdatedAt(LocalDateTime.now());
            userStatusRepository.save(status);
            broadcastPresence(user.getId(), "OFFLINE", null);
        } catch (Exception ignored) {}
    }

    private void broadcastPresence(Long userId, String presence, String customMessage) {
        Map<String, Object> event = new HashMap<>();
        event.put("type", "PRESENCE_UPDATE");
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId);
        payload.put("presence", presence);
        payload.put("customMessage", customMessage);
        event.put("payload", payload);
        messagingTemplate.convertAndSend("/topic/workspace/presence", event);
    }
}
