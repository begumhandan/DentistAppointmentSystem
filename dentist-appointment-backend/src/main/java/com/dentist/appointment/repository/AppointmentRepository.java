package com.dentist.appointment.repository;

import com.dentist.appointment.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByDoctorName(String doctorName);
    List<Appointment> findByPatientName(String patientName);
    List<Appointment> findByDoctorIdAndStatus(String doctorId, String status);
}
