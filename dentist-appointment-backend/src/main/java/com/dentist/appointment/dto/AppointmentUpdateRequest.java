package com.dentist.appointment.dto;

import lombok.Data;

@Data
public class AppointmentUpdateRequest {
    private String status;   //  "APPROVED", "REJECTED"
    private String note;     // "Kanal tedavisi, röntgen çekilecek"
    private Integer duration; //  45 (Dakika)
    private String appointmentDate;
}