package com.locktrust.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private UserResponse user;
    private String message;

    public AuthResponse(String message) {
        this.message = message;
    }
}
