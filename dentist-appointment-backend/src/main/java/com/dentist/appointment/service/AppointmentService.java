package com.dentist.appointment.service;

import com.dentist.appointment.model.Appointment;
import com.dentist.appointment.model.User;
import com.dentist.appointment.repository.AppointmentRepository;
import com.dentist.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.dentist.appointment.dto.AppointmentUpdateRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository; // Hastayı ve doktoru bulmak için eklendi

    // tüm randevuları çekme
    public List getAllAppointments() {
        return appointmentRepository.findAll();
    }

    // tek randevu çekme
    public Optional getAppointmentById(String id) {
        return appointmentRepository.findById(id);
    }

    // yeni randevu oluşturma
    public Appointment createAppointment(Map request) {
        String patientId = String.valueOf(request.get("patientId"));
        String doctorId = String.valueOf(request.get("doctorId"));
        String dateString = String.valueOf(request.get("appointmentDate"));

        LocalDateTime date = LocalDateTime.parse(dateString);

        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Hasta bulunamadı!"));
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doktor bulunamadı!"));

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(date);
        appointment.setStatus("PENDING");

        return appointmentRepository.save(appointment);
    }

    //randevu güncellenme
    public Appointment updateAppointment(String id, AppointmentUpdateRequest request) {
        //databaseden randevuyu bul
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek randevu bulunamadı!"));
        //yeni statusu güncelle
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }
        //notu güncelle
        if (request.getNote() != null) {
            appointment.setNote(request.getNote());
        }
        //dakika güncelle
        if (request.getDuration() != null) {
            appointment.setDuration(request.getDuration());
        }
        //datatbase kaydet
        return appointmentRepository.save(appointment);
    }
    //randevu silme
    public void deleteAppointment(String id) {
        appointmentRepository.deleteById(id);
    }
}