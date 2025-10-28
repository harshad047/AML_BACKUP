package com.tss.aml.dto.document;

import java.time.Instant;

import com.tss.aml.entity.Enums.DocumentStatus;

import lombok.Data;

@Data
public class DocumentDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private String docType;
    private String storagePath;
    private DocumentStatus status;
    private Instant uploadedAt;
    private String rejectionReason;
}

