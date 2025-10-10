package com.tss.aml.dto.compliance;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NoteDto {
    private Long id;
    private String author;
    private String content;
    private LocalDateTime createdAt;
}
