package com.tss.aml.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tss.aml.entity.Enums.KycStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;


@Data
@Entity
@Table(name = "customers",
       uniqueConstraints = {
         @UniqueConstraint(columnNames = "email")
       })
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max=100)
    @Column(name="first_name", nullable=false)
    private String firstName;
    
    @NotBlank @Size(max=20)
    @Column(name="dob", nullable=false)
    private String dob;

    @Size(max=100)
    @Column(name="middle_name")
    private String middleName;

    @NotBlank @Size(max=100)
    @Column(name="last_name", nullable=false)
    private String lastName;

    @NotBlank @Email @Size(max=150)
    @Column(nullable=false)
    private String email;
    
    @Column(unique = true, nullable = false)
    private String username;

    @Size(max=20)
    private String phone; 

    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Size(min = 8, max = 100)
    @Column(name = "password", nullable = false)
    private String password;



    @Embedded
    private Address address;

    
    @Enumerated(EnumType.STRING)
    @Column(name="kyc_status", nullable=false, length=20)
    private KycStatus kycStatus = KycStatus.PENDING;

    @Column(name="created_at", nullable=false, updatable=false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy="customer", cascade=CascadeType.ALL, orphanRemoval=true)
    @JsonIgnore
    private List<Document> documents = new ArrayList<>();

    public void addDocument(Document doc) {
        documents.add(doc);
        doc.setCustomer(this);
    }

    public void removeDocument(Document doc) {
        documents.remove(doc);
        doc.setCustomer(null);

}
}
