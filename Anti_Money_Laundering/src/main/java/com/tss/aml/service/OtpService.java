package com.tss.aml.service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.tss.aml.repository.UserRepository;

import jakarta.mail.internet.MimeMessage;

@Service
public class OtpService {

    private final ConcurrentMap<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, ResetTokenEntry> resetTokens = new ConcurrentHashMap<>();
    private final int EXPIRY_SECONDS = 300; // 5 minutes

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private UserRepository userRepository;

    public boolean sendOtpToEmail(String email) {
        try {
            // For registration, allow sending OTP even if email is not yet in DB.
            // Forgot-password flow performs its own existence check in the controller.
            String key = email == null ? null : email.trim().toLowerCase();
            if (key == null || key.isEmpty()) {
                return false;
            }
            String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
            OtpEntry entry = new OtpEntry(otp, Instant.now().plusSeconds(EXPIRY_SECONDS));
            store.put(key, entry);
            log.debug("OTP generated and stored for key={} otp={} expiresAt={}", key, otp, entry.expiresAt);

            String htmlContent = """
                <html>
                    <head>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f4;
                                padding: 20px;
                            }
                            .container {
                                max-width: 500px;
                                margin: auto;
                                background: #ffffff;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                            }
                            h2 {
                                color: #333333;
                            }
                            .otp {
                                font-size: 24px;
                                font-weight: bold;
                                color: #007bff;
                                margin: 20px 0;
                            }
                            .note {
                                font-size: 14px;
                                color: #555555;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Your Verification OTP</h2>
                            <p>Use the OTP below to complete your registration:</p>
                            <div class="otp">""" + otp + """
                            <p class="note">This OTP is valid for 5 minutes.</p>
                        </div>
                    </body>
                </html>
            """;

            // Send as HTML email
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(key);

            helper.setSubject("Your verification OTP");
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(mimeMessage);
            return true;
            
        } catch (Exception e) {
            log.error("Error sending OTP to {}", email, e);
            return false;
        }
    }


    public boolean verifyOtp(String email, String otp) {
        String key = email == null ? null : email.trim().toLowerCase();
        if (key == null) return false;

        OtpEntry e = store.get(key);
        if (e == null) {
            log.debug("No OTP found for email: {}", key);
            return false;
        }

        if (Instant.now().isAfter(e.expiresAt)) {
            store.remove(key);
            log.debug("OTP expired for key={} at {}", key, e.expiresAt);
            return false;
        }

        if (otp == null) return false;
        // Remove all whitespace from provided OTP and compare
        String provided = otp.replaceAll("\\s+", "");
        boolean ok = e.otp.equals(provided);
        log.debug("Verifying OTP for key={} providedEndsWith={} storedEndsWith={} result={}", key, provided.length()>=2?provided.substring(provided.length()-2):provided, e.otp.substring(4), ok);
        if (ok) {
            // Don't remove OTP here - let it be removed after successful password reset
            // store.remove(key);
        }
        return ok;
    }

    /**
     * Issue a short-lived reset token after successful OTP verification.
     * Consumes/removes the OTP to prevent reuse, returns a token string.
     */
    public String issueResetToken(String email) {
        String key = email == null ? null : email.trim().toLowerCase();
        if (key == null) return null;
        // remove any existing token
        resetTokens.remove(key);
        // consume OTP once token is issued
        store.remove(key);
        String token = UUID.randomUUID().toString().replace("-", "");
        ResetTokenEntry entry = new ResetTokenEntry(token, Instant.now().plusSeconds(EXPIRY_SECONDS));
        resetTokens.put(key, entry);
        log.debug("Reset token issued for key={} tokenEndsWith={} expiresAt={}", key, token.substring(token.length()-6), entry.expiresAt);
        return token;
    }

    /**
     * Validate the reset token and optionally consume it (one-time use).
     */
    public boolean validateResetToken(String email, String token, boolean consume) {
        String key = email == null ? null : email.trim().toLowerCase();
        if (key == null || token == null || token.isBlank()) return false;
        ResetTokenEntry entry = resetTokens.get(key);
        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt)) {
            resetTokens.remove(key);
            return false;
        }
        boolean ok = token.equals(entry.token);
        if (ok && consume) {
            resetTokens.remove(key);
        }
        return ok;
    }

    public void consumeOtp(String email) {
        String key = email == null ? null : email.trim().toLowerCase();
        if (key != null) {
            store.remove(key);
            log.debug("OTP consumed/removed for key={}", key);
        }
    }

    // Internal entry for reset token
    static class ResetTokenEntry {
        final String token;
        final Instant expiresAt;
        ResetTokenEntry(String token, Instant expiresAt) {
            this.token = token;
            this.expiresAt = expiresAt;
        }
    }
}