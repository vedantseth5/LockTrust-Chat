package com.locktrust.chat.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class TypingHandler {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/channel/{channelId}/typing")
    public void handleTyping(@DestinationVariable Long channelId,
                             Map<String, Object> payload,
                             Principal principal) {
        Map<String, Object> event = new HashMap<>();
        boolean isTyping = Boolean.TRUE.equals(payload.get("isTyping"));
        event.put("type", isTyping ? "TYPING_START" : "TYPING_STOP");
        Map<String, Object> data = new HashMap<>();
        data.put("channelId", channelId);
        data.put("userId", payload.get("userId"));
        data.put("displayName", payload.get("displayName"));
        event.put("payload", data);
        messagingTemplate.convertAndSend("/topic/channel/" + channelId + "/typing", event);
    }
}
