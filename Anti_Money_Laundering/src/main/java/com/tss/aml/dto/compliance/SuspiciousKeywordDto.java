package com.tss.aml.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuspiciousKeywordDto {

    private Long id;

    @NotBlank(message = "Keyword cannot be blank")
    @Size(max = 255, message = "Keyword cannot exceed 255 characters")
    private String keyword;

    @NotNull(message = "Risk level is required")
    private String riskLevel; // CRITICAL, HIGH, MEDIUM, LOW

    @Min(value = 0, message = "Risk score must be non-negative")
    @Max(value = 100, message = "Risk score cannot exceed 100")
    private Integer riskScore;

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    private String category;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private boolean active = true;

    private boolean caseSensitive = false;

    private boolean wholeWordOnly = true;

    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    private String createdBy;

    @Size(max = 100, message = "Updated by cannot exceed 100 characters")
    private String updatedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

