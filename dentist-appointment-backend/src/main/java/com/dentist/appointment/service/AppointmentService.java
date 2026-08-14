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


    public Appointment updateAppointment(String id, AppointmentUpdateRequest request) {
        //databaseden randevuyu bul
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek randevu bulunamadı!"));

        // Yeni başlangıç saatini belirle (İstekte tarih varsa onu parse et, yoksa eskisini kullan)
        LocalDateTime newStartTime = request.getAppointmentDate() != null
                ? LocalDateTime.parse(request.getAppointmentDate())
                : appointment.getAppointmentDate();

        // Yeni süreyi belirle (İstekte süre varsa onu al, yoksa eskisini kullan, o da yoksa 30 dk varsay)
        int newDuration = request.getDuration() != null
                ? request.getDuration()
                : (appointment.getDuration() != null ? appointment.getDuration() : 30);

        // Bitiş saatini hesapla
        LocalDateTime newEndTime = newStartTime.plusMinutes(newDuration);

        // Status onaylı mı kontrol et (Sadece APPROVED olanlar takvimde yer kaplar ve çakışır)
        String statusToCheck = request.getStatus() != null ? request.getStatus() : appointment.getStatus();

        if ("APPROVED".equals(statusToCheck) || "RESCHEDULED_BY_CLINIC".equals(statusToCheck)) {
            // Doktorun diğer onaylı randevularını getirsin
            List<Appointment> doctorsAppointments = appointmentRepository.findByDoctorIdAndStatus(appointment.getDoctor().getId(), "APPROVED");

            for (Appointment app : doctorsAppointments) {
                // Randevu kendisiyle çakışma testine girmesin diye atlıyoruz
                if (app.getId().equals(appointment.getId())) {
                    continue;
                }

                LocalDateTime otherStart = app.getAppointmentDate();
                int otherDuration = app.getDuration() != null ? app.getDuration() : 30;
                LocalDateTime otherEnd = otherStart.plusMinutes(otherDuration);

                // kesişme var mı (zaman )
                if (newStartTime.isBefore(otherEnd) && newEndTime.isAfter(otherStart)) {
                    //çakışma varsa hata at.
                    throw new IllegalStateException("Bu saat aralığında " + app.getPatient().getName() + " adlı hastanın (" + otherStart.toLocalTime() + ") randevusu bulunmaktadır.");
                }
            }
        }

        // yeni statusu güncelle
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }
        // notu güncelle
        if (request.getNote() != null) {
            appointment.setNote(request.getNote());
        }
        // dakika güncelle
        if (request.getDuration() != null) {
            appointment.setDuration(request.getDuration());
        }
        // tarihi güncelle
        if (request.getAppointmentDate() != null) {
            // gelen string tarihli olan LocalDateTime objesine çevirip kaydettik
            appointment.setAppointmentDate(LocalDateTime.parse(request.getAppointmentDate()));
        }

        // database kaydet
        return appointmentRepository.save(appointment);
    }

    //randevu silme
    public void deleteAppointment(String id) {
        appointmentRepository.deleteById(id);
    }

}