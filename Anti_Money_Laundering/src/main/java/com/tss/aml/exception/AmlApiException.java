package com.tss.aml.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AmlApiException extends RuntimeException {
    private final HttpStatus status;

    public AmlApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }
}
