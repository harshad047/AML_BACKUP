package com.tss.aml.controller;

import com.tss.aml.dto.AlertDto;
import com.tss.aml.dto.CaseDto;
import com.tss.aml.dto.NoteDto;
import com.tss.aml.service.ComplianceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('OFFICER', 'ADMIN')")
public class ComplianceController {

    private final ComplianceService complianceService;

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertDto>> getAllOpenAlerts() {
        return ResponseEntity.ok(complianceService.getAllOpenAlerts());
    }

    @GetMapping("/alerts/{id}")
    public ResponseEntity<AlertDto> getAlertById(@PathVariable Long id) {
        return ResponseEntity.ok(complianceService.getAlertById(id));
    }

    @PostMapping("/alerts/{id}/case")
    public ResponseEntity<CaseDto> createCaseFromAlert(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(complianceService.createCaseFromAlert(id, username));
    }

    @PostMapping("/cases/{id}/notes")
    public ResponseEntity<CaseDto> addNoteToCase(@PathVariable Long id, @RequestBody NoteDto noteDto, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(complianceService.addNoteToCase(id, username, noteDto.getContent()));
    }
}
