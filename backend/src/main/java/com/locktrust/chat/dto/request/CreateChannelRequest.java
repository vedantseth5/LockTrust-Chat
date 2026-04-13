package com.locktrust.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateChannelRequest {
    @NotBlank
    @Pattern(regexp = "^[a-z0-9-_]+$", message = "Channel name can only contain lowercase letters, numbers, hyphens and underscores")
    private String name;
    private String description;
    private Boolean isPrivate = false;
}
