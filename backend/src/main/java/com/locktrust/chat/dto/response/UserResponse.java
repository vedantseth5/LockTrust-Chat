package com.locktrust.chat.dto.response;

import com.locktrust.chat.model.User;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String phone;
    private String email;
    private String displayName;
    private String role;
    private String avatarColor;
    private String title;
    private String timezone;
    private String presence;
    private String customStatusMessage;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setPhone(user.getPhone());
        r.setEmail(user.getEmail());
        r.setDisplayName(user.getDisplayName());
        r.setRole(user.getRole());
        r.setAvatarColor(user.getAvatarColor());
        r.setTitle(user.getTitle());
        r.setTimezone(user.getTimezone());
        r.setCreatedAt(user.getCreatedAt());
        if (user.getStatus() != null) {
            r.setPresence(user.getStatus().getPresence());
            r.setCustomStatusMessage(user.getStatus().getCustomMessage());
        } else {
            r.setPresence("OFFLINE");
        }
        return r;
    }
}
