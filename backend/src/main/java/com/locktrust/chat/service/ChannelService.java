package com.locktrust.chat.service;

import com.locktrust.chat.dto.request.CreateChannelRequest;
import com.locktrust.chat.dto.response.ChannelResponse;
import com.locktrust.chat.dto.response.UserResponse;
import com.locktrust.chat.model.Channel;
import com.locktrust.chat.model.User;
import com.locktrust.chat.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<ChannelResponse> getVisibleChannels(Long userId) {
        return channelRepository.findVisibleChannels(userId).stream()
                .map(ChannelResponse::from)
                .collect(Collectors.toList());
    }

    public ChannelResponse getChannel(Long channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        return ChannelResponse.from(channel);
    }

    @Transactional
    public ChannelResponse createChannel(String creatorEmail, CreateChannelRequest request) {
        if (channelRepository.existsByName(request.getName())) {
            throw new RuntimeException("Channel name already taken.");
        }
        User creator = userService.getByEmail(creatorEmail);
        Channel channel = Channel.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isPrivate(request.getIsPrivate())
                .createdBy(creator)
                .build();
        channel.getMembers().add(creator);
        channel = channelRepository.save(channel);

        // Broadcast channel creation
        Map<String, Object> event = new HashMap<>();
        event.put("type", "CHANNEL_CREATED");
        event.put("payload", ChannelResponse.from(channel));
        messagingTemplate.convertAndSend("/topic/workspace/channels", event);

        return ChannelResponse.from(channel);
    }

    @Transactional
    public ChannelResponse joinChannel(Long channelId, String userEmail) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        User user = userService.getByEmail(userEmail);

        if (channel.getIsPrivate()) {
            throw new RuntimeException("Cannot join a private channel directly.");
        }

        channel.getMembers().add(user);
        channel = channelRepository.save(channel);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "MEMBER_JOINED");
        Map<String, Object> payload = new HashMap<>();
        payload.put("channelId", channelId);
        payload.put("userId", user.getId());
        payload.put("displayName", user.getDisplayName());
        event.put("payload", payload);
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, event);

        return ChannelResponse.from(channel);
    }

    @Transactional
    public void leaveChannel(Long channelId, String userEmail) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        User user = userService.getByEmail(userEmail);
        channel.getMembers().remove(user);
        channelRepository.save(channel);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "MEMBER_LEFT");
        Map<String, Object> payload = new HashMap<>();
        payload.put("channelId", channelId);
        payload.put("userId", user.getId());
        event.put("payload", payload);
        messagingTemplate.convertAndSend("/topic/channel/" + channelId, event);
    }

    @Transactional
    public ChannelResponse addMember(Long channelId, Long targetUserId, String requesterEmail) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        User requester = userService.getByEmail(requesterEmail);
        User target = userService.getById(targetUserId);

        boolean isAdmin = "ADMIN".equals(requester.getRole());
        boolean isCreator = channel.getCreatedBy() != null && channel.getCreatedBy().getId().equals(requester.getId());
        boolean isMember = channel.getMembers().stream().anyMatch(m -> m.getId().equals(requester.getId()));
        if (!isAdmin && !isCreator && !isMember) {
            throw new RuntimeException("You must be a member to invite others to this channel.");
        }

        channel.getMembers().add(target);
        channel = channelRepository.save(channel);
        return ChannelResponse.from(channel);
    }

    public Long getUserIdByEmail(String email) {
        return userService.getByEmail(email).getId();
    }

    public List<UserResponse> getChannelMembers(Long channelId) {
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        return channel.getMembers().stream().map(UserResponse::from).collect(Collectors.toList());
    }
}
