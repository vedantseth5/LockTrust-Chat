package com.locktrust.chat.controller;

import com.locktrust.chat.dto.request.SendMessageRequest;
import com.locktrust.chat.dto.response.MessageResponse;
import com.locktrust.chat.dto.response.ThreadReplyResponse;
import com.locktrust.chat.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels/{channelId}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable Long channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(messageService.getChannelMessages(channelId, page, size));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long channelId,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(messageService.sendMessage(channelId, userDetails.getUsername(), request));
    }

    @PutMapping("/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long channelId,
            @PathVariable Long messageId,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(messageService.editMessage(messageId, userDetails.getUsername(), request));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long channelId,
            @PathVariable Long messageId) {
        messageService.deleteMessage(messageId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{messageId}/replies")
    public ResponseEntity<List<ThreadReplyResponse>> getReplies(@PathVariable Long channelId,
                                                                @PathVariable Long messageId) {
        return ResponseEntity.ok(messageService.getThreadReplies(messageId));
    }

    @PostMapping("/{messageId}/replies")
    public ResponseEntity<ThreadReplyResponse> addReply(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long channelId,
            @PathVariable Long messageId,
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(messageService.addReply(messageId, userDetails.getUsername(), request));
    }
}
