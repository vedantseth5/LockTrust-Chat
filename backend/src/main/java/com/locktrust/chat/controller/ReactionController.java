package com.locktrust.chat.controller;

import com.locktrust.chat.dto.response.DirectMessageResponse;
import com.locktrust.chat.service.ReactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping("/api/messages/{messageId}/reactions")
    public ResponseEntity<Void> toggleMessageReaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        reactionService.toggleMessageReaction(messageId, userDetails.getUsername(), body.get("emoji"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/replies/{replyId}/reactions")
    public ResponseEntity<Void> toggleReplyReaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long replyId,
            @RequestBody Map<String, String> body) {
        reactionService.toggleThreadReplyReaction(replyId, userDetails.getUsername(), body.get("emoji"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/dm/messages/{dmId}/reactions")
    public ResponseEntity<DirectMessageResponse> toggleDmReaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long dmId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
            reactionService.toggleDmReaction(dmId, userDetails.getUsername(), body.get("emoji"))
        );
    }
}
