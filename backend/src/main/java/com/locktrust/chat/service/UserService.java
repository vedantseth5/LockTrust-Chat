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

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
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
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = getByEmail(email);
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank())
            user.setDisplayName(request.getDisplayName());
        if (request.getTitle() != null) user.setTitle(request.getTitle());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getTimezone() != null) user.setTimezone(request.getTimezone());
        if (request.getAvatarColor() != null) user.setAvatarColor(request.getAvatarColor());
        userRepository.save(user);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateStatus(String email, UpdateStatusRequest request) {
        User user = getByEmail(email);
        UserStatus status = userStatusRepository.findById(user.getId())
                .orElse(UserStatus.builder().user(user).build());

        if (request.getPresence() != null) status.setPresence(request.getPresence());
        if (request.getCustomMessage() != null) status.setCustomMessage(request.getCustomMessage());
        status.setUpdatedAt(LocalDateTime.now());
        userStatusRepository.save(status);

        // Broadcast presence update
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
    public void setUserOnline(String email) {
        try {
            User user = getByEmail(email);
            UserStatus status = userStatusRepository.findById(user.getId())
                    .orElse(UserStatus.builder().user(user).build());
            status.setPresence("ONLINE");
            status.setUpdatedAt(LocalDateTime.now());
            userStatusRepository.save(status);
            broadcastPresence(user.getId(), "ONLINE", status.getCustomMessage());
        } catch (Exception ignored) {}
    }

    @Transactional
    public void setUserOffline(String email) {
        try {
            User user = getByEmail(email);
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
