package com.locktrust.chat.dto.request;

import lombok.Data;

@Data
public class UpdateStatusRequest {
    private String presence; // ONLINE, AWAY, DND, OFFLINE
    private String customMessage;
}
