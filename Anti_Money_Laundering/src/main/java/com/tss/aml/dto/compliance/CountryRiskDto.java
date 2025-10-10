package com.tss.aml.dto.compliance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CountryRiskDto {

    private Long id;

    @NotBlank(message = "Country code is required")
    @Size(min = 2, max = 3, message = "Country code must be 2-3 characters")
    @Pattern(regexp = "^[A-Z]{2,3}$", message = "Country code must be uppercase letters only")
    private String countryCode;

    @NotBlank(message = "Country name is required")
    @Size(max = 100, message = "Country name cannot exceed 100 characters")
    private String countryName;

    @NotNull(message = "Risk score is required")
    @Min(value = 0, message = "Risk score must be non-negative")
    @Max(value = 100, message = "Risk score cannot exceed 100")
    private Integer riskScore;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    private boolean isActive = true;

    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    private String createdBy;

    @Size(max = 100, message = "Updated by cannot exceed 100 characters")
    private String updatedBy;

    private Instant createdAt;
    private Instant updatedAt;

    // Helper method to get risk level based on score
    public String getRiskLevel() {
        if (riskScore >= 80) return "HIGH";
        if (riskScore >= 50) return "MEDIUM";
        if (riskScore >= 20) return "LOW";
        return "VERY_LOW";
    }
}

