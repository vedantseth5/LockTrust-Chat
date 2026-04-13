package com.locktrust.chat.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CreateDmRequest {
    private List<Long> participantIds;
    private String name; // optional, for group DMs
}
