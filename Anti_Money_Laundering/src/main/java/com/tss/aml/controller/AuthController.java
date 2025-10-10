package com.tss.aml.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.Auth.AuthResponse;
import com.tss.aml.dto.Auth.LoginDto;
import com.tss.aml.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginDto loginDto) {
        AuthResponse authResponse = authService.login(loginDto);
        return ResponseEntity.ok(authResponse);
    }
}