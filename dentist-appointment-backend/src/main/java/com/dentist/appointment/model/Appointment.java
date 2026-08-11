package com.dentist.appointment.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;

    // randevuyu alan hasta
    @DBRef
    private User patient;

    // randevudaki doktor
    @DBRef
    private User doctor;

    //randevu tarih-saat
    private LocalDateTime appointmentDate;

    // randevu durum
    private String status = "PENDING";
}