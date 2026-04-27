package com.locktrust.chat.controller;

import com.locktrust.chat.dto.response.ChannelResponse;
import com.locktrust.chat.dto.response.DirectMessageResponse;
import com.locktrust.chat.dto.response.DmConversationResponse;
import com.locktrust.chat.dto.response.MessageResponse;
import com.locktrust.chat.dto.response.UserResponse;
import com.locktrust.chat.model.User;
import com.locktrust.chat.repository.ChannelRepository;
import com.locktrust.chat.repository.DirectMessageRepository;
import com.locktrust.chat.repository.DmConversationRepository;
import com.locktrust.chat.repository.MessageRepository;
import com.locktrust.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final MessageRepository messageRepository;
    private final DmConversationRepository dmConversationRepository;
    private final DirectMessageRepository directMessageRepository;

    private void requireAdmin(UserDetails principal) {
        User caller = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!"ADMIN".equals(caller.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    // ── Users ────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers(@AuthenticationPrincipal UserDetails principal) {
        requireAdmin(principal);
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        requireAdmin(principal);
        String role = body.get("role");
        if (role == null || (!role.equals("ADMIN") && !role.equals("MEMBER"))) {
            throw new RuntimeException("Invalid role");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    // ── Channels ─────────────────────────────────────────────────────────────

    @GetMapping("/channels")
    public ResponseEntity<List<ChannelResponse>> listChannels(@AuthenticationPrincipal UserDetails principal) {
        requireAdmin(principal);
        List<ChannelResponse> channels = channelRepository.findAll().stream()
                .map(ChannelResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(channels);
    }

    @GetMapping("/channels/{id}/messages")
    public ResponseEntity<List<MessageResponse>> channelMessages(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        requireAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        List<MessageResponse> messages = messageRepository
                .findByChannelIdOrderByCreatedAtAsc(id, pageable)
                .stream()
                .map(MessageResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    // ── Search ───────────────────────────────────────────────────────────────

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String q) {
        requireAdmin(principal);

        List<MessageResponse> messages = messageRepository.adminSearchMessages(q)
                .stream().limit(30).map(MessageResponse::from).collect(Collectors.toList());

        List<DirectMessageResponse> dms = directMessageRepository.adminSearchMessages(q)
                .stream().limit(30).map(DirectMessageResponse::from).collect(Collectors.toList());

        List<UserResponse> users = userRepository.findAll().stream()
                .filter(u -> u.getDisplayName().toLowerCase().contains(q.toLowerCase())
                          || u.getEmail().toLowerCase().contains(q.toLowerCase()))
                .limit(20).map(UserResponse::from).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("messages", messages, "dms", dms, "users", users));
    }

    // ── User activity ─────────────────────────────────────────────────────────

    @GetMapping("/users/{id}/activity")
    public ResponseEntity<Map<String, Object>> userActivity(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id) {
        requireAdmin(principal);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<MessageResponse> messages = messageRepository.findByUserId(id)
                .stream().limit(50).map(MessageResponse::from).collect(Collectors.toList());

        List<DirectMessageResponse> dms = directMessageRepository.findByUserId(id)
                .stream().limit(50).map(DirectMessageResponse::from).collect(Collectors.toList());

        List<ChannelResponse> channels = channelRepository.findChannelsByMemberId(id)
                .stream().map(ChannelResponse::from).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "user", UserResponse.from(user),
                "messages", messages,
                "dms", dms,
                "channels", channels
        ));
    }

    // ── DMs ──────────────────────────────────────────────────────────────────

    @GetMapping("/dm/conversations")
    public ResponseEntity<List<DmConversationResponse>> listDmConversations(
            @AuthenticationPrincipal UserDetails principal) {
        requireAdmin(principal);
        List<DmConversationResponse> convs = dmConversationRepository.findAll().stream()
                .map(DmConversationResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(convs);
    }

    @GetMapping("/dm/conversations/{id}/messages")
    public ResponseEntity<List<DirectMessageResponse>> dmMessages(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        requireAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        List<DirectMessageResponse> messages = directMessageRepository
                .findByConversationIdOrderByCreatedAtAsc(id, pageable)
                .stream()
                .map(DirectMessageResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }
}
