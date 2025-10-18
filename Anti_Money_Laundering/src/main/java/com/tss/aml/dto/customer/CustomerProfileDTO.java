package com.tss.aml.dto.customer;

import com.tss.aml.entity.Address;
import com.tss.aml.entity.Enums.KycStatus;

import lombok.Data;

@Data
public class CustomerProfileDTO {
    private Long id;
    private String firstName;
    private String middleName;
    private String lastName;
    private String email;
    private String username;
    private String phone;
    private Address address;
    private KycStatus kycStatus;
    private String createdAt;
}
