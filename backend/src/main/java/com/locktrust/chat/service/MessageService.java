package com.locktrust.chat.service;

import com.locktrust.chat.dto.request.SendMessageRequest;
import com.locktrust.chat.dto.response.MessageResponse;
import com.locktrust.chat.dto.response.ThreadReplyResponse;
import com.locktrust.chat.model.*;
import com.locktrust.chat.repository.ChannelRepository;
import com.locktrust.chat.repository.MessageRepository;
import com.locktrust.chat.repository.ThreadReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ThreadReplyRepository threadReplyRepository;
    private final ChannelRepository channelRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public Page<MessageResponse> getChannelMessages(Long channelId, int page, int size) {
        return messageRepository.findByChannelIdAndDeletedFalseOrderByCreatedAtAsc(
                channelId, PageRequest.of(page, size))
                .map(MessageResponse::from);
    }

    @Transactional
    public MessageResponse sendMessage(Long channelId, String senderEmail, SendMessageRequest request) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        User sender = userService.getByEmail(senderEmail);

        Message message = Message.builder()
                .channel(channel)
                .sender(sender)
                .content(request.getContent())
                .build();
        message = messageRepository.save(message);
        MessageResponse response = MessageResponse.from(message);

        // Broadcast to channel
        Map<String, Object> event = new HashMap<>();
        event.put("type", "MESSAGE_NEW");
        event.put("payload", response);
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, event);

        // Send mention notifications
        sendMentionNotifications(message, channel);

        return response;
    }

    @Transactional
    public MessageResponse editMessage(Long messageId, String editorEmail, SendMessageRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User editor = userService.getByEmail(editorEmail);

        if (!message.getSender().getId().equals(editor.getId())) {
            throw new RuntimeException("You can only edit your own messages.");
        }

        message.setContent(request.getContent());
        message.setEdited(true);
        message.setUpdatedAt(LocalDateTime.now());
        message = messageRepository.save(message);
        MessageResponse response = MessageResponse.from(message);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "MESSAGE_EDIT");
        event.put("payload", response);
        messagingTemplate.convertAndSend("/topic/channel/" + message.getChannel().getId(), event);

        return response;
    }

    @Transactional
    public void deleteMessage(Long messageId, String deleterEmail) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User deleter = userService.getByEmail(deleterEmail);

        boolean isAdmin = "ADMIN".equals(deleter.getRole());
        if (!message.getSender().getId().equals(deleter.getId()) && !isAdmin) {
            throw new RuntimeException("You can only delete your own messages.");
        }

        message.setDeleted(true);
        message.setUpdatedAt(LocalDateTime.now());
        messageRepository.save(message);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "MESSAGE_DELETE");
        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", messageId);
        payload.put("channelId", message.getChannel().getId());
        event.put("payload", payload);
        messagingTemplate.convertAndSend("/topic/channel/" + message.getChannel().getId(), event);
    }

    public List<ThreadReplyResponse> getThreadReplies(Long messageId) {
        return threadReplyRepository.findByParentMessageIdAndDeletedFalseOrderByCreatedAtAsc(messageId)
                .stream().map(ThreadReplyResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public ThreadReplyResponse addReply(Long messageId, String senderEmail, SendMessageRequest request) {
        Message parent = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User sender = userService.getByEmail(senderEmail);

        ThreadReply reply = ThreadReply.builder()
                .parentMessage(parent)
                .sender(sender)
                .content(request.getContent())
                .build();
        reply = threadReplyRepository.save(reply);
        ThreadReplyResponse response = ThreadReplyResponse.from(reply);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "THREAD_REPLY_NEW");
        event.put("payload", response);
        messagingTemplate.convertAndSend("/topic/channel/" + parent.getChannel().getId(), event);

        return response;
    }

    private void sendMentionNotifications(Message message, Channel channel) {
        Pattern mentionPattern = Pattern.compile("@(\\S+)");
        Matcher matcher = mentionPattern.matcher(message.getContent());
        while (matcher.find()) {
            String mentionedName = matcher.group(1);
            channel.getMembers().stream()
                    .filter(u -> u.getDisplayName().equalsIgnoreCase(mentionedName)
                            && !u.getId().equals(message.getSender().getId()))
                    .forEach(u -> {
                        Map<String, Object> notif = new HashMap<>();
                        notif.put("type", "NOTIFICATION_MENTION");
                        Map<String, Object> payload = new HashMap<>();
                        payload.put("messageId", message.getId());
                        payload.put("channelId", channel.getId());
                        payload.put("channelName", channel.getName());
                        payload.put("mentionedByUserId", message.getSender().getId());
                        payload.put("mentionedByName", message.getSender().getDisplayName());
                        payload.put("preview", message.getContent().substring(0, Math.min(100, message.getContent().length())));
                        notif.put("payload", payload);
                        messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", notif);
                    });
        }
    }
}
