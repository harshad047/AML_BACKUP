package com.tss.aml.dto.Auth;

import java.time.Instant;

/**
 * Represents an OTP entry with the generated OTP value and its expiration time.
 */
public class OtpEntry {
    public final String otp;
    public final Instant expiresAt;

    public OtpEntry(String otp, Instant expiresAt) {
        this.otp = otp;
        this.expiresAt = expiresAt;
    }
}
