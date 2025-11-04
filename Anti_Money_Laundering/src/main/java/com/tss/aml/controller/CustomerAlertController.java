package com.tss.aml.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.compliance.AlertDto;
import com.tss.aml.service.impl.AlertServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/customer/alerts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
public class CustomerAlertController {

    private final AlertServiceImpl alertService;

    @GetMapping
    public ResponseEntity<List<AlertDto>> getMyAlerts(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(alertService.getAlertsForCustomer(username));
    }

    @GetMapping("/{alertId}")
    public ResponseEntity<AlertDto> getAlertDetails(@PathVariable Long alertId, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(alertService.getAlertForCustomer(alertId, username));
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<AlertDto>> getAlertsForTransaction(@PathVariable Long transactionId, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(alertService.getAlertsForTransaction(transactionId, username));
    }
}
