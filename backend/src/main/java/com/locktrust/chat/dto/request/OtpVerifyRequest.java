package com.locktrust.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank
    private String phone;    // full E.164, e.g. "+15551234567"
    @NotBlank
    private String otp;
    @NotBlank
    private String purpose;  // SIGNUP or LOGIN
}
