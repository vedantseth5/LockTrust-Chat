package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.Message;
import com.locktrust.chat.model.Reaction;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
public class MessageResponse {
    private Long id;
    private Long channelId;
    private Long senderId;
    private String senderName;
    private String senderAvatarColor;
    private String content;
    private Boolean edited;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ReactionResponse> reactions;
    private long replyCount;

    public static MessageResponse from(Message message) {
        MessageResponse r = new MessageResponse();
        r.setId(message.getId());
        r.setChannelId(message.getChannel().getId());
        r.setSenderId(message.getSender().getId());
        r.setSenderName(message.getSender().getDisplayName());
        r.setSenderAvatarColor(message.getSender().getAvatarColor());
        r.setContent(message.getDeleted() ? "[Message deleted]" : message.getContent());
        r.setEdited(message.getEdited());
        r.setDeleted(message.getDeleted());
        r.setCreatedAt(message.getCreatedAt());
        r.setUpdatedAt(message.getUpdatedAt());
        r.setReplyCount(message.getReplies() != null ? message.getReplies().stream().filter(rep -> !rep.getDeleted()).count() : 0);

        Map<String, List<Reaction>> grouped = message.getReactions().stream()
                .collect(Collectors.groupingBy(Reaction::getEmoji));
        r.setReactions(grouped.entrySet().stream()
                .map(e -> new ReactionResponse(e.getKey(), e.getValue().size(),
                        e.getValue().stream().map(rx -> rx.getUser().getId()).collect(Collectors.toList())))
                .collect(Collectors.toList()));
        return r;
    }
}
