package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.compliance.AlertDto;

public interface IAlertService {
	
	List<AlertDto> getAlertsForCustomer(String usernameOrEmail);

    AlertDto getAlertForCustomer(Long alertId, String usernameOrEmail);

    List<AlertDto> getAlertsForTransaction(Long transactionId, String usernameOrEmail);
}
