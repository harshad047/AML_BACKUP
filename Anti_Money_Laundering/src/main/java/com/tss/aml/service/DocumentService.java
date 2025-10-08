package com.tss.aml.service;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.Document;
import com.tss.aml.entity.Enums.DocumentStatus;
import com.tss.aml.entity.Enums.KycStatus;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.DocumentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Transactional
    public Document uploadAndSaveDocument(String userEmail, MultipartFile file, String docType) throws IOException {
        // 1. Find the customer associated with the logged-in user
        Customer customer = customerRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found for email: " + userEmail));

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

    public List<Document> getDocumentsForUserEmail(String userEmail) {
        Customer customer = customerRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found for email: " + userEmail));
        return documentRepository.findByCustomer(customer);
    }

    public List<Document> getDocumentsByStatus(DocumentStatus status) {
        return documentRepository.findByStatus(status);
    }

    @Transactional
    public Document verifyDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found: " + documentId));
        doc.setStatus(DocumentStatus.VERIFIED);
        Document saved = documentRepository.save(doc);
        // If all required docs policy isn't defined, mark KYC APPROVED on any verification event
        Customer customer = saved.getCustomer();
        if (customer != null) {
            customer.setKycStatus(KycStatus.APPROVED);
            customerRepository.save(customer);
        }
        return saved;
    }

	public Document rejectDocument(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found: " + documentId));
        doc.setStatus(DocumentStatus.VERIFIED);
        Document saved = documentRepository.save(doc);
        Customer customer = saved.getCustomer();
        if (customer != null) {
            customer.setKycStatus(KycStatus.REJECTED);
            customerRepository.save(customer);
        }
        return saved;
	}
}