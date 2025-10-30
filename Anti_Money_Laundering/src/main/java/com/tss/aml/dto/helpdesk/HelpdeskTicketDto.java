package com.tss.aml.dto.helpdesk;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class HelpdeskTicketDto {
    private Long id;
    private Long transactionId;
    private Long customerId;
    private Long assignedOfficerId;
    private String subject;
    private String message;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
