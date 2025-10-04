package com.tss.aml.controller;

import com.tss.aml.dto.AlertDto;
import com.tss.aml.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/alerts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
public class CustomerAlertController {

    private final AlertService alertService;

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
