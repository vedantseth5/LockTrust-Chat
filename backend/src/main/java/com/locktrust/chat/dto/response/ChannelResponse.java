package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.Channel;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ChannelResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean isPrivate;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private int memberCount;
    private List<Long> memberIds;

    public static ChannelResponse from(Channel channel) {
        ChannelResponse r = new ChannelResponse();
        r.setId(channel.getId());
        r.setName(channel.getName());
        r.setDescription(channel.getDescription());
        r.setIsPrivate(channel.getIsPrivate());
        r.setCreatedAt(channel.getCreatedAt());
        if (channel.getCreatedBy() != null) {
            r.setCreatedById(channel.getCreatedBy().getId());
            r.setCreatedByName(channel.getCreatedBy().getDisplayName());
        }
        r.setMemberCount(channel.getMembers().size());
        r.setMemberIds(channel.getMembers().stream().map(u -> u.getId()).collect(Collectors.toList()));
        return r;
    }
}
