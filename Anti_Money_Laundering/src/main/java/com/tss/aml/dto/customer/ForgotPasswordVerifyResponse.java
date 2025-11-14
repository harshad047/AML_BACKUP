package com.tss.aml.dto.customer;

public class ForgotPasswordVerifyResponse {
	public boolean verified;
	public String resetToken;
	public String message;

	public ForgotPasswordVerifyResponse(boolean verified, String resetToken, String message) {
		this.verified = verified;
		this.resetToken = resetToken;
		this.message = message;
	}
}