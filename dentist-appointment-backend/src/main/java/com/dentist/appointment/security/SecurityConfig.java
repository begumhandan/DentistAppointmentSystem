package com.dentist.appointment.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http

                .cors(Customizer.withDefaults())
                //csrf devre dışı
                .csrf(csrf -> csrf.disable())

                // hangi adreslere kimlerin erişebileceğini kurallara bağladı
                .authorizeHttpRequests(auth -> auth
                        // login register herkese açık
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated() // diğer tüm isteklerde mutlaka token istesin
                )

                // rest Appı olod için oturum susta her istek için ayrı token
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // kimlik doğrulama
                .authenticationProvider(authenticationProvider)

                //yazdığım JwtAuthenticationFilter kısmını springin giriş filtresinin önüne koyuyoruz
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
            CorsConfiguration configuration = new CorsConfiguration();
            // React'in çalıştığı adrese izin veriyoruz
            configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
            // İzin verilen HTTP metodları (OPTIONS da koyduk)
            configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            // İzin verilen başlıklar (Token'ı Authorization başlığında gönderdik)
            configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
            // Kimlik bilgilerine (cookie vb.) izin ver
            configuration.setAllowCredentials(true);

            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/**", configuration);

            return source;

    }
}