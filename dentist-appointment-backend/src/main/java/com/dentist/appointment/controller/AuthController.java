package com.dentist.appointment.controller;

import com.dentist.appointment.dto.AuthenticationRequest;
import com.dentist.appointment.dto.AuthenticationResponse;
import com.dentist.appointment.dto.RegisterRequest;
import com.dentist.appointment.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") //react uyg adresi
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService service;

    // kayıt olma POST http://localhost:8080/api/auth/register
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    // giriş yapma: POST http://localhost:8080/api/auth/authenticate
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }
}