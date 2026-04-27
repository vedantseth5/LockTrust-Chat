package com.locktrust.chat.controller;

import com.locktrust.chat.dto.request.CreateDmRequest;
import com.locktrust.chat.dto.request.SendMessageRequest;
import com.locktrust.chat.dto.response.DirectMessageResponse;
import com.locktrust.chat.dto.response.DmConversationResponse;
import com.locktrust.chat.service.DmService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DmController {

    private final DmService dmService;

    @GetMapping("/conversations")
    public ResponseEntity<List<DmConversationResponse>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(dmService.getConversations(userDetails.getUsername()));
    }

    @PostMapping("/conversations")
    public ResponseEntity<DmConversationResponse> createConversation(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateDmRequest request) {
        return ResponseEntity.ok(dmService.createOrGetConversation(userDetails.getUsername(), request));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<Page<DirectMessageResponse>> getMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(dmService.getMessages(id, userDetails.getUsername(), page, size));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<DirectMessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(dmService.sendMessage(id, userDetails.getUsername(), request));
    }

    @PutMapping("/conversations/{convId}/messages/{msgId}")
    public ResponseEntity<DirectMessageResponse> editMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long convId,
            @PathVariable Long msgId,
            @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(dmService.editMessage(convId, msgId, userDetails.getUsername(), request));
    }

    @DeleteMapping("/conversations/{convId}/messages/{msgId}")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long convId,
            @PathVariable Long msgId) {
        dmService.deleteMessage(convId, msgId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
