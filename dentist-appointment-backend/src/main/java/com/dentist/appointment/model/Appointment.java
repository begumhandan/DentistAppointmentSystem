package com.dentist.appointment.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "appointments")
public class Appointment {

    @Id
    private String id;
    
    private String patientName;
    private String doctorName;
    private LocalDateTime date;
    private String status;
    private String note;


}
