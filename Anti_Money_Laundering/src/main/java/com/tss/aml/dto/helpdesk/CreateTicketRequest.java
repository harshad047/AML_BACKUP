package com.tss.aml.dto.helpdesk;

import lombok.Data;

@Data
public class CreateTicketRequest {
    private String subject;
    private String message;
}
