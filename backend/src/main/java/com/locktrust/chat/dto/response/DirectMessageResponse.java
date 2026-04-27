package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.DirectMessage;
import com.locktrust.chat.model.Reaction;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
public class DirectMessageResponse {
    private Long id;
    private Long conversationId;
    private String conversationLabel;
    private List<String> participantNames;
    private Long senderId;
    private String senderName;
    private String senderAvatarColor;
    private String content;
    private Long replyToId;
    private String replyToSenderName;
    private String replyToContent;
    private List<ReactionResponse> reactions;
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
        r.setReplyToId(msg.getReplyToId());
        r.setReplyToSenderName(msg.getReplyToSenderName());
        r.setReplyToContent(msg.getReplyToContent());
        Map<String, List<Reaction>> grouped = msg.getReactions().stream()
                .collect(Collectors.groupingBy(Reaction::getEmoji));
        r.setReactions(grouped.entrySet().stream()
                .map(e -> new ReactionResponse(e.getKey(), e.getValue().size(),
                        e.getValue().stream().map(rx -> rx.getUser().getId()).collect(Collectors.toList())))
                .collect(Collectors.toList()));
        r.setEdited(msg.getEdited());
        r.setDeleted(msg.getDeleted());
        r.setCreatedAt(msg.getCreatedAt());

        List<String> names = msg.getConversation().getParticipants().stream()
                .map(u -> u.getDisplayName())
                .collect(Collectors.toList());
        r.setParticipantNames(names);
        r.setConversationLabel(
            msg.getConversation().getName() != null
                ? msg.getConversation().getName()
                : String.join(" & ", names)
        );
        return r;
    }
}
