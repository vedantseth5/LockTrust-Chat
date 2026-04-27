package com.locktrust.chat.controller;

import com.locktrust.chat.dto.response.ChannelResponse;
import com.locktrust.chat.dto.response.MessageResponse;
import com.locktrust.chat.dto.response.UserResponse;
import com.locktrust.chat.repository.ChannelRepository;
import com.locktrust.chat.repository.MessageRepository;
import com.locktrust.chat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final MessageRepository messageRepository;
    private final ChannelRepository channelRepository;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q) {

        Long userId = userService.getByEmail(userDetails.getUsername()).getId();

        List<MessageResponse> messages = messageRepository.searchMessagesForUser(userId, q)
                .stream().limit(20).map(MessageResponse::from).collect(Collectors.toList());

        List<ChannelResponse> channels = channelRepository.searchChannels(q)
                .stream().limit(10).map(ChannelResponse::from).collect(Collectors.toList());

        List<UserResponse> users = userService.searchUsers(q).stream().limit(10).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("messages", messages);
        result.put("channels", channels);
        result.put("users", users);
        return ResponseEntity.ok(result);
    }
}
