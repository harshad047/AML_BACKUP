package com.tss.aml.service;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.tss.aml.dto.document.DocumentDTO;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.Enums.DocumentStatus;

public interface IDocumentService {
	Document uploadAndSaveDocument(String username, MultipartFile file, String docType) throws IOException;
    List<DocumentDTO> getDocumentsForUserEmail(String username);
    List<DocumentDTO> getDocumentsByStatus(DocumentStatus status);
    List<DocumentDTO> getAllDocuments();
    DocumentDTO verifyDocument(Long documentId);
    DocumentDTO rejectDocument(Long documentId, String reason);
    DocumentDTO getDocumentById(Long documentId);
}
