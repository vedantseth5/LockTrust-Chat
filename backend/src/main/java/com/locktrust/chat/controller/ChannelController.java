package com.locktrust.chat.controller;

import com.locktrust.chat.dto.request.CreateChannelRequest;
import com.locktrust.chat.dto.response.ChannelResponse;
import com.locktrust.chat.dto.response.UserResponse;
import com.locktrust.chat.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    public ResponseEntity<List<ChannelResponse>> getChannels(@AuthenticationPrincipal UserDetails userDetails) {
        var user = userDetails; // get id via service
        return ResponseEntity.ok(channelService.getVisibleChannels(
                channelService.getUserIdByIdentifier(userDetails.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ChannelResponse> createChannel(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateChannelRequest request) {
        return ResponseEntity.ok(channelService.createChannel(userDetails.getUsername(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChannelResponse> getChannel(@PathVariable Long id) {
        return ResponseEntity.ok(channelService.getChannel(id));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ChannelResponse> joinChannel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(channelService.joinChannel(id, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leaveChannel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        channelService.leaveChannel(id, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserResponse>> getMembers(@PathVariable Long id) {
        return ResponseEntity.ok(channelService.getChannelMembers(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ChannelResponse> addMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(channelService.addMember(id, body.get("userId"), userDetails.getUsername()));
    }
}
