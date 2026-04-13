package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.DirectMessage;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DirectMessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatarColor;
    private String content;
    private Boolean edited;
    private Boolean deleted;
    private LocalDateTime createdAt;

    public static DirectMessageResponse from(DirectMessage msg) {
        DirectMessageResponse r = new DirectMessageResponse();
        r.setId(msg.getId());
        r.setConversationId(msg.getConversation().getId());
        r.setSenderId(msg.getSender().getId());
        r.setSenderName(msg.getSender().getDisplayName());
        r.setSenderAvatarColor(msg.getSender().getAvatarColor());
        r.setContent(msg.getDeleted() ? "[Message deleted]" : msg.getContent());
        r.setEdited(msg.getEdited());
        r.setDeleted(msg.getDeleted());
        r.setCreatedAt(msg.getCreatedAt());
        return r;
    }
}
