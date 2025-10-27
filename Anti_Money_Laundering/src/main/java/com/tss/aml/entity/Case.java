package com.tss.aml.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "cases")
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name = "alert_id")
    private Alert alert;

    private String assignedTo; // Username of the compliance officer

    @Enumerated(EnumType.STRING)
    @Column(length = 25, nullable = false)
    private CaseStatus status = CaseStatus.UNDER_INVESTIGATION;

    @OneToMany(mappedBy = "caseEntity", cascade = CascadeType.ALL)
    private List<InvestigationNote> notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public enum CaseStatus {
        UNDER_INVESTIGATION, RESOLVED, PENDING_SAR
    }
}
