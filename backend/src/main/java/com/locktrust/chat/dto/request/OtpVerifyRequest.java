package com.locktrust.chat.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @Email @NotBlank
    private String email;
    @NotBlank
    private String otp;
    @NotBlank
    private String purpose; // SIGNUP or LOGIN
}
