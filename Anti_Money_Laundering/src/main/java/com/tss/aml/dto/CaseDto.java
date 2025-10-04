package com.tss.aml.dto;

import com.tss.aml.entity.Case;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CaseDto {
    private Long id;
    private AlertDto alert;
    private String assignedTo;
    private Case.CaseStatus status;
    private List<NoteDto> notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
