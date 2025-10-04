package com.tss.aml.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class JwtConfig {
    private String jwtSecret;
    private long jwtExpirationMilliseconds;
}
