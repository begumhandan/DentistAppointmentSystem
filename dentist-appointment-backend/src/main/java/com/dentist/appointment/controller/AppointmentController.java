package com.dentist.appointment.controller;

import com.dentist.appointment.model.Appointment;
import com.dentist.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.dentist.appointment.dto.AppointmentUpdateRequest;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin("*")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity createAppointment(@RequestBody Map request) {
        return ResponseEntity.ok(appointmentService.createAppointment(request));
    }

    @GetMapping
    public ResponseEntity getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PutMapping("/{id}")
    public ResponseEntity updateAppointment(
            @PathVariable String id,
            @RequestBody AppointmentUpdateRequest request) {

        try {
            Appointment updatedAppointment = appointmentService.updateAppointment(id, request);
            return ResponseEntity.ok(updatedAppointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    }
