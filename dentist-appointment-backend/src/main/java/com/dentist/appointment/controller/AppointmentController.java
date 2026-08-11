package com.dentist.appointment.controller;

import com.dentist.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
}