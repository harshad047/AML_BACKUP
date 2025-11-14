package com.tss.aml.dto.Auth;

import java.time.Instant;


public class OtpEntry {
    public final String otp;
    public final Instant expiresAt;

    public OtpEntry(String otp, Instant expiresAt) {
        this.otp = otp;
        this.expiresAt = expiresAt;
    }
}
