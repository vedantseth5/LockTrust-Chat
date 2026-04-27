package com.locktrust.chat.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String displayName;
    private String title;
    private String phone;
    private String timezone;
    private String avatarColor;
}
