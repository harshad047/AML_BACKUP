package com.tss.aml.dto.customer;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class KycStatusResponse {
	public final String kycStatus;
	public final String message;
}