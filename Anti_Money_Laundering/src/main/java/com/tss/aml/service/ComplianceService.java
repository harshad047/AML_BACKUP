package com.tss.aml.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.AlertDto;
import com.tss.aml.dto.CaseDto;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Case;
import com.tss.aml.entity.InvestigationNote;
import com.tss.aml.exception.ResourceNotFoundException;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.CaseRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComplianceService {

	@Autowired
    private final AlertRepository alertRepository;
	@Autowired
    private final CaseRepository caseRepository;
	
	
    private final ModelMapper modelMapper = new ModelMapper();

    public List<AlertDto> getAllOpenAlerts() {
        return alertRepository.findAll().stream()
                .filter(alert -> alert.getStatus() == Alert.AlertStatus.OPEN)
                .map(alert -> modelMapper.map(alert, AlertDto.class))
                .collect(Collectors.toList());
    }

    public AlertDto getAlertById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", id));
        return modelMapper.map(alert, AlertDto.class);
    }

    public CaseDto createCaseFromAlert(Long alertId, String assignedTo) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));
        alert.setStatus(Alert.AlertStatus.ESCALATED);
        alertRepository.save(alert);

        Case caseInstance = new Case();
        caseInstance.setAlert(alert);
        caseInstance.setAssignedTo(assignedTo);
        Case savedCase = caseRepository.save(caseInstance);
        return modelMapper.map(savedCase, CaseDto.class);
    }

    public CaseDto addNoteToCase(Long caseId, String author, String content) {
        Case foundCase = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", "id", caseId));

        InvestigationNote note = new InvestigationNote();
        note.setCaseEntity(foundCase);
        note.setAuthor(author);
        note.setContent(content);

        foundCase.getNotes().add(note);
        Case savedCase = caseRepository.save(foundCase);
        return modelMapper.map(savedCase, CaseDto.class);
    }
}
