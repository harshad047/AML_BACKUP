package com.tss.aml.dto;

import com.tss.aml.entity.Role;
import lombok.Data;

@Data
public class CreateUserDto {
    private String email;
    private String password;
    private Role role;
}
