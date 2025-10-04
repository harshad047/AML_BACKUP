package com.tss.aml.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.Map;

import com.tss.aml.dto.BankAccountDto;
import com.tss.aml.dto.CreateUserDto;
import com.tss.aml.dto.RuleDto;
import com.tss.aml.dto.SuspiciousKeywordDto;
import com.tss.aml.dto.UserDto;
import com.tss.aml.service.AdminService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserDto createUserDto) {
        return new ResponseEntity<>(adminService.createUser(createUserDto), HttpStatus.CREATED);
    }

    @GetMapping("/rules")
    public ResponseEntity<List<RuleDto>> getAllRules() {
        return ResponseEntity.ok(adminService.getAllRules());
    }

    @PostMapping("/rules")
    public ResponseEntity<RuleDto> createRule(@RequestBody RuleDto ruleDto) {
        return new ResponseEntity<>(adminService.createRule(ruleDto), HttpStatus.CREATED);
    }

    @GetMapping("/keywords")
    public ResponseEntity<List<SuspiciousKeywordDto>> getAllKeywords() {
        return ResponseEntity.ok(adminService.getAllKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<SuspiciousKeywordDto> addKeyword(@RequestBody SuspiciousKeywordDto keywordDto) {
        return new ResponseEntity<>(adminService.addKeyword(keywordDto), HttpStatus.CREATED);
    }

    @GetMapping("/accounts/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN') or hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BankAccountDto>> getPendingAccounts() {
        return ResponseEntity.ok(adminService.getPendingAccounts());
    }

    @PostMapping("/accounts/{id}/approve")
    public ResponseEntity<BankAccountDto> approveAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveAccount(id));
    }

    @PostMapping("/accounts/{id}/reject")
    public ResponseEntity<BankAccountDto> rejectAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.rejectAccount(id));
    }
    
    @GetMapping("/accounts")
    public ResponseEntity<List<BankAccountDto>> getAllAccounts() {
        return ResponseEntity.ok(adminService.getAllAccounts());
    }
    
    @GetMapping("/accounts/{id}")
    public ResponseEntity<BankAccountDto> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getAccountById(id));
    }
    
    @PostMapping("/accounts/{id}/suspend")
    public ResponseEntity<BankAccountDto> suspendAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.suspendAccount(id));
    }
    
    @PostMapping("/accounts/{id}/activate")
    public ResponseEntity<BankAccountDto> activateAccount(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.activateAccount(id));
    }
    
    @GetMapping("/debug/auth")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> debugAuth(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(Map.of("error", "No authentication found"));
        }
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return ResponseEntity.ok(Map.of(
            "username", authentication.getName(),
            "authorities", authorities.stream().map(GrantedAuthority::getAuthority).toList(),
            "principal", authentication.getPrincipal().getClass().getSimpleName(),
            "authenticated", authentication.isAuthenticated()
        ));
    }
}
