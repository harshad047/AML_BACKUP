package com.tss.aml.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NoteDto {
    private Long id;
    private String author;
    private String content;
    private LocalDateTime createdAt;
}
