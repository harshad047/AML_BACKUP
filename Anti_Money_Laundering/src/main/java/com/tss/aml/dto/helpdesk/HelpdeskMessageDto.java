package com.tss.aml.dto.helpdesk;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class HelpdeskMessageDto {
    private Long id;
    private Long ticketId;
    private Long authorId;
    private String senderType; // CUSTOMER or OFFICER
    private String content;
    private LocalDateTime createdAt;
}
