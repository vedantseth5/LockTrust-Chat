package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.DmConversation;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class DmConversationResponse {
    private Long id;
    private Boolean isGroup;
    private String name;
    private LocalDateTime createdAt;
    private List<UserResponse> participants;

    public static DmConversationResponse from(DmConversation conv) {
        DmConversationResponse r = new DmConversationResponse();
        r.setId(conv.getId());
        r.setIsGroup(conv.getIsGroup());
        r.setName(conv.getName());
        r.setCreatedAt(conv.getCreatedAt());
        r.setParticipants(conv.getParticipants().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList()));
        return r;
    }
}
