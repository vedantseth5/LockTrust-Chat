package com.locktrust.chat.service;

import com.locktrust.chat.dto.response.DirectMessageResponse;
import com.locktrust.chat.model.DirectMessage;
import com.locktrust.chat.model.Message;
import com.locktrust.chat.model.Reaction;
import com.locktrust.chat.model.ThreadReply;
import com.locktrust.chat.model.User;
import com.locktrust.chat.repository.DirectMessageRepository;
import com.locktrust.chat.repository.MessageRepository;
import com.locktrust.chat.repository.ReactionRepository;
import com.locktrust.chat.repository.ThreadReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final ThreadReplyRepository threadReplyRepository;
    private final DirectMessageRepository directMessageRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void toggleMessageReaction(Long messageId, String userEmail, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userService.getByEmail(userEmail);

        Optional<Reaction> existing = reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, user.getId(), emoji);
        String eventType;
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            eventType = "REACTION_REMOVE";
        } else {
            Reaction reaction = Reaction.builder().message(message).user(user).emoji(emoji).build();
            reactionRepository.save(reaction);
            eventType = "REACTION_ADD";
        }

        long count = message.getReactions().stream().filter(r -> r.getEmoji().equals(emoji)).count();
        Map<String, Object> event = new HashMap<>();
        event.put("type", eventType);
        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", messageId);
        payload.put("emoji", emoji);
        payload.put("userId", user.getId());
        payload.put("count", existing.isPresent() ? count - 1 : count + 1);
        event.put("payload", payload);
        messagingTemplate.convertAndSend("/topic/channel/" + message.getChannel().getId(), event);
    }

    @Transactional
    public void toggleThreadReplyReaction(Long replyId, String userEmail, String emoji) {
        ThreadReply reply = threadReplyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        User user = userService.getByEmail(userEmail);

        Optional<Reaction> existing = reactionRepository.findByThreadReplyIdAndUserIdAndEmoji(replyId, user.getId(), emoji);
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
        } else {
            Reaction reaction = Reaction.builder().threadReply(reply).user(user).emoji(emoji).build();
            reactionRepository.save(reaction);
        }
    }

    @Transactional
    public DirectMessageResponse toggleDmReaction(Long dmId, String userEmail, String emoji) {
        DirectMessage msg = directMessageRepository.findById(dmId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userService.getByEmail(userEmail);

        Optional<Reaction> existing = reactionRepository.findByDirectMessageIdAndUserIdAndEmoji(dmId, user.getId(), emoji);
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            msg.getReactions().remove(existing.get());
        } else {
            Reaction reaction = Reaction.builder().directMessage(msg).user(user).emoji(emoji).build();
            reactionRepository.save(reaction);
            msg.getReactions().add(reaction);
        }

        DirectMessageResponse response = DirectMessageResponse.from(msg);

        // Broadcast updated message to all conversation participants
        Map<String, Object> event = new HashMap<>();
        event.put("type", "DM_REACTION");
        event.put("payload", response);
        msg.getConversation().getParticipants().forEach(p ->
            messagingTemplate.convertAndSendToUser(p.getEmail(), "/queue/dm", event)
        );

        return response;
    }
}
