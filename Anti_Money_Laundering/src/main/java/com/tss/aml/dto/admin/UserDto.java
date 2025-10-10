package com.tss.aml.dto.admin;

import com.tss.aml.entity.Role;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private Role role;
}

