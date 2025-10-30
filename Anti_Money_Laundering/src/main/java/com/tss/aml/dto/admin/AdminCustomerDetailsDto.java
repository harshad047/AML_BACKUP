package com.tss.aml.dto.admin;

import com.tss.aml.entity.Address;
import com.tss.aml.entity.Enums.KycStatus;
import lombok.Data;

@Data
public class AdminCustomerDetailsDto {
    private Long userId;
    private Long customerId;
    private String username;
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private String phone;
    private Address address;
    private KycStatus kycStatus;
    private boolean enabled;
    private String createdAt;
    private long transactionCount;
    private long alertCount;
}
