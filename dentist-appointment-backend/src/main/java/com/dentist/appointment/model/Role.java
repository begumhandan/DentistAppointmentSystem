package com.dentist.appointment.model;

public enum Role {
    ROLE_PATIENT,   // Sadece kendi randevularını yönetebilir
    ROLE_DOCTOR,    // Kendi randevularını görür, durumlarını günceller
    ROLE_SECRETARY  // Tüm sisteme hakimdir (Admin)
}