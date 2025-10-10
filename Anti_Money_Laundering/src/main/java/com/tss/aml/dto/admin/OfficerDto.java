package com.tss.aml.dto.admin;

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
public class OfficerDto {

    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Size(max = 50, message = "Username cannot exceed 50 characters")
    private String username;

    @NotBlank(message = "Employee ID is required")
    @Size(max = 20, message = "Employee ID cannot exceed 20 characters")
    private String employeeId;

    @NotBlank(message = "Department is required")
    @Size(max = 50, message = "Department cannot exceed 50 characters")
    private String department;

    @NotBlank(message = "Position is required")
    @Size(max = 50, message = "Position cannot exceed 50 characters")
    private String position;

    @NotNull(message = "Role is required")
    private String role; // Only COMPLIANCE_OFFICER

    private boolean isActive = true;

    @Size(max = 15, message = "Phone number cannot exceed 15 characters")
    private String phoneNumber;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    private String createdBy;

    @Size(max = 100, message = "Updated by cannot exceed 100 characters")
    private String updatedBy;

    private Instant createdAt;
    private Instant updatedAt;

    // Statistics
    private Long totalCasesHandled;
    private Long activeCases;
    private Long resolvedCases;
}

