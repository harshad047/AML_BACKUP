package com.tss.aml.dto;

import com.tss.aml.entity.Role;
import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private Role role;
}
