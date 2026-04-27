package com.locktrust.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class ReactionResponse {
    private String emoji;
    private long count;
    private List<Long> userIds;
}
