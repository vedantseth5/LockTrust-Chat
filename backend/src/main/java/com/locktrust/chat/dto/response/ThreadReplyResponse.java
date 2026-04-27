package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.Reaction;
import com.locktrust.chat.model.ThreadReply;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
public class ThreadReplyResponse {
    private Long id;
    private Long parentMessageId;
    private Long senderId;
    private String senderName;
    private String senderAvatarColor;
    private String content;
    private Boolean edited;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private List<ReactionResponse> reactions;

    public static ThreadReplyResponse from(ThreadReply reply) {
        ThreadReplyResponse r = new ThreadReplyResponse();
        r.setId(reply.getId());
        r.setParentMessageId(reply.getParentMessage().getId());
        r.setSenderId(reply.getSender().getId());
        r.setSenderName(reply.getSender().getDisplayName());
        r.setSenderAvatarColor(reply.getSender().getAvatarColor());
        r.setContent(reply.getDeleted() ? "[Message deleted]" : reply.getContent());
        r.setEdited(reply.getEdited());
        r.setDeleted(reply.getDeleted());
        r.setCreatedAt(reply.getCreatedAt());

        Map<String, List<Reaction>> grouped = reply.getReactions().stream()
                .collect(Collectors.groupingBy(Reaction::getEmoji));
        r.setReactions(grouped.entrySet().stream()
                .map(e -> new ReactionResponse(e.getKey(), e.getValue().size(),
                        e.getValue().stream().map(rx -> rx.getUser().getId()).collect(Collectors.toList())))
                .collect(Collectors.toList()));
        return r;
    }
}
