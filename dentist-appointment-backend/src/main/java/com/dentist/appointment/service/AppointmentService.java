package com.dentist.appointment.service;

import com.dentist.appointment.model.Appointment;
import com.dentist.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Optional<Appointment> getAppointmentById(String id) {
        return appointmentRepository.findById(id);
    }

    public Appointment createAppointment(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointment(String id, Appointment appointmentDetails) {
        return appointmentRepository.findById(id).map(appointment -> {
            appointment.setPatientName(appointmentDetails.getPatientName());
            appointment.setDoctorName(appointmentDetails.getDoctorName());
            appointment.setDate(appointmentDetails.getDate());
            appointment.setStatus(appointmentDetails.getStatus());
            appointment.setNote(appointmentDetails.getNote());
            return appointmentRepository.save(appointment);
        }).orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public void deleteAppointment(String id) {
        appointmentRepository.deleteById(id);
    }
}
