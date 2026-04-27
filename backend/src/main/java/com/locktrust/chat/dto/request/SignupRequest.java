package com.locktrust.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank
    private String countryCode;   // e.g. "+1"
    @NotBlank
    private String phoneNumber;   // e.g. "5551234567"
    @NotBlank
    private String displayName;
    private String email;         // optional
}
