package com.dentist.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String name;
    private String surname;
    private String username;
    private String password;
    private String role; // "ROLE_PATIENT", "ROLE_DOCTOR","ROLE_SECRETARY"
}