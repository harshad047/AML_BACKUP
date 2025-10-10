package com.tss.aml.service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.tss.aml.dto.document.DocumentDTO;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.Enums.DocumentStatus;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.DocumentRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Transactional
    public Document uploadAndSaveDocument(String username, MultipartFile file, String docType) throws IOException {
        // 1. Find the customer associated with the logged-in user
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        // 2. Upload the file to Cloudinary in a user-specific folder
        String folderName = "customer_" + customer.getId();
        String fileUrl = cloudinaryService.uploadFile(file, folderName);

        // 3. Create and save the document entity
        Document document = new Document();
        document.setCustomer(customer);
        document.setDocType(docType.toUpperCase()); 
        document.setStoragePath(fileUrl);
        
        // Move customer KYC to UNDER_REVIEW on any new upload
        if (customer.getKycStatus() != KycStatus.APPROVED) {
            customer.setKycStatus(KycStatus.UNDER_REVIEW);
            customerRepository.save(customer);
        }
        
        return documentRepository.save(document);
    }

    public List<DocumentDTO> getDocumentsForUserEmail(String username) {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        List<Document> documents = documentRepository.findByCustomer(customer);

        return documents.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<DocumentDTO> getDocumentsByStatus(DocumentStatus status) {
        List<Document> documents = documentRepository.findByStatus(status);
        return documents.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public DocumentDTO verifyDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with ID: " + documentId));

        document.setStatus(DocumentStatus.VERIFIED);
        documentRepository.save(document);

        return convertToDTO(document);
    }

    public DocumentDTO rejectDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with ID: " + documentId));

        document.setStatus(DocumentStatus.REJECTED);
        documentRepository.save(document);

        return convertToDTO(document);
    }
	
	private DocumentDTO convertToDTO(Document doc) {
	    DocumentDTO dto = new DocumentDTO();
	    dto.setId(doc.getId());
	    dto.setCustomerId(doc.getCustomer().getId());
	    dto.setDocType(doc.getDocType());
	    dto.setStoragePath(doc.getStoragePath());
	    dto.setStatus(doc.getStatus());
	    dto.setUploadedAt(doc.getUploadedAt());
	    return dto;
	}
}
