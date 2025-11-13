package com.tss.aml.service.impl;

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
import com.tss.aml.service.IDocumentService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class DocumentServiceImpl implements IDocumentService{

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Transactional
    public Document uploadAndSaveDocument(String username, MultipartFile file, String docType) throws IOException {
        Customer customer = customerRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));

        String folderName = "customer_" + customer.getId();
        String fileUrl = cloudinaryService.uploadFile(file, folderName);

        Document document = new Document();
        document.setCustomer(customer);
        document.setDocType(docType.toUpperCase()); 
        document.setStoragePath(fileUrl);
        
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

    public List<DocumentDTO> getAllDocuments() {
        List<Document> documents = documentRepository.findAll();
        return documents.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public DocumentDTO verifyDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with ID: " + documentId));
        
        Customer customer = customerRepository.findById(document.getCustomer().getId())
        		.orElseThrow(()->new EntityNotFoundException("Customer NOt Found"));
        document.setStatus(DocumentStatus.VERIFIED);
        document.setRejectionReason(null);
        customer.setKycStatus(KycStatus.APPROVED);
        
        documentRepository.save(document);
        customerRepository.save(customer);

        return convertToDTO(document);
    }

    public DocumentDTO rejectDocument(Long documentId, String reason) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with ID: " + documentId));

        document.setStatus(DocumentStatus.REJECTED);
        document.setRejectionReason(reason);
        documentRepository.save(document);

        return convertToDTO(document);
    }
	
	private DocumentDTO convertToDTO(Document doc) {
	    DocumentDTO dto = new DocumentDTO();
	    dto.setId(doc.getId());
	    dto.setCustomerId(doc.getCustomer().getId());
	    String first = doc.getCustomer().getFirstName();
	    String last = doc.getCustomer().getLastName();
	    dto.setCustomerName(((first != null ? first : "").trim() + " " + (last != null ? last : "").trim()).trim());
	    dto.setDocType(doc.getDocType());
	    dto.setStoragePath(doc.getStoragePath());
	    dto.setStatus(doc.getStatus());
	    dto.setUploadedAt(doc.getUploadedAt());
	    dto.setRejectionReason(doc.getRejectionReason());
	    return dto;
	}

    public DocumentDTO getDocumentById(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with ID: " + documentId));
        return convertToDTO(document);
    }
}
