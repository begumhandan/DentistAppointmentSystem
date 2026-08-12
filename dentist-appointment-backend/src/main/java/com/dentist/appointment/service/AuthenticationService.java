package com.dentist.appointment.service;
import com.dentist.appointment.dto.AuthenticationRequest;
import com.dentist.appointment.dto.AuthenticationResponse;
import com.dentist.appointment.dto.RegisterRequest;
import com.dentist.appointment.model.User;
import com.dentist.appointment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    //kayıt ol
    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .name(request.getName())
                .surname(request.getSurname())
                .username(request.getUsername())
                //bycrpt şifreleme
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : "ROLE_PATIENT") // Varsayılan rol: Hasta
                .build();

        userRepository.save(user);

        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole())
                .name(user.getName())
                .id(user.getId())
                .build();
    }

    //giriş yap
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // kullanıcı adı ve şifre kontrolü
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // kullanıcıyı bulma
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        // yeni token üret
        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(user.getRole())
                .name(user.getName())
                .id(user.getId())
                .build();
    }
}