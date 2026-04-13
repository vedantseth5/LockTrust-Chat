package com.locktrust.chat.service;

import com.locktrust.chat.dto.request.CreateDmRequest;
import com.locktrust.chat.dto.request.SendMessageRequest;
import com.locktrust.chat.dto.response.DirectMessageResponse;
import com.locktrust.chat.dto.response.DmConversationResponse;
import com.locktrust.chat.model.*;
import com.locktrust.chat.repository.DirectMessageRepository;
import com.locktrust.chat.repository.DmConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DmService {

    private final DmConversationRepository conversationRepository;
    private final DirectMessageRepository messageRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<DmConversationResponse> getConversations(String userEmail) {
        User user = userService.getByEmail(userEmail);
        return conversationRepository.findByParticipantId(user.getId()).stream()
                .map(DmConversationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public DmConversationResponse createOrGetConversation(String requesterEmail, CreateDmRequest request) {
        User requester = userService.getByEmail(requesterEmail);

        List<Long> allParticipantIds = new ArrayList<>(request.getParticipantIds());
        if (!allParticipantIds.contains(requester.getId())) {
            allParticipantIds.add(requester.getId());
        }

        boolean isGroup = allParticipantIds.size() > 2;

        if (!isGroup && allParticipantIds.size() == 2) {
            Long otherId = allParticipantIds.stream()
                    .filter(id -> !id.equals(requester.getId()))
                    .findFirst().orElse(null);
            Optional<DmConversation> existing = conversationRepository.findDirectConversation(requester.getId(), otherId);
            if (existing.isPresent()) return DmConversationResponse.from(existing.get());
        }

        Set<User> participants = allParticipantIds.stream()
                .map(userService::getById)
                .collect(Collectors.toSet());

        DmConversation conv = DmConversation.builder()
                .isGroup(isGroup)
                .name(request.getName())
                .participants(participants)
                .build();
        conv = conversationRepository.save(conv);
        return DmConversationResponse.from(conv);
    }

    public Page<DirectMessageResponse> getMessages(Long conversationId, String userEmail, int page, int size) {
        User user = userService.getByEmail(userEmail);
        DmConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        boolean isMember = conv.getParticipants().stream().anyMatch(p -> p.getId().equals(user.getId()));
        if (!isMember) throw new RuntimeException("Access denied.");
        return messageRepository.findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(
                conversationId, PageRequest.of(page, size))
                .map(DirectMessageResponse::from);
    }

    @Transactional
    public DirectMessageResponse sendMessage(Long conversationId, String senderEmail, SendMessageRequest request) {
        DmConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        User sender = userService.getByEmail(senderEmail);

        DirectMessage msg = DirectMessage.builder()
                .conversation(conv)
                .sender(sender)
                .content(request.getContent())
                .build();
        msg = messageRepository.save(msg);
        DirectMessageResponse response = DirectMessageResponse.from(msg);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "DM_NEW");
        event.put("payload", response);

        conv.getParticipants().forEach(p -> {
            if (!p.getId().equals(sender.getId())) {
                messagingTemplate.convertAndSendToUser(p.getEmail(), "/queue/dm", event);
            }
        });

        return response;
    }

    @Transactional
    public DirectMessageResponse editMessage(Long conversationId, Long messageId, String editorEmail, SendMessageRequest request) {
        DirectMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User editor = userService.getByEmail(editorEmail);
        if (!msg.getSender().getId().equals(editor.getId())) throw new RuntimeException("Cannot edit others' messages.");
        msg.setContent(request.getContent());
        msg.setEdited(true);
        return DirectMessageResponse.from(messageRepository.save(msg));
    }

    @Transactional
    public void deleteMessage(Long conversationId, Long messageId, String deleterEmail) {
        DirectMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User deleter = userService.getByEmail(deleterEmail);
        if (!msg.getSender().getId().equals(deleter.getId())) throw new RuntimeException("Cannot delete others' messages.");
        msg.setDeleted(true);
        messageRepository.save(msg);
    }
}
