package com.locktrust.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String countryCode;   // e.g. "+1"
    @NotBlank
    private String phoneNumber;   // e.g. "5551234567"
}
