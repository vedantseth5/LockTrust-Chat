package com.locktrust.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank
    private String content;
    private Long replyToId;
}
