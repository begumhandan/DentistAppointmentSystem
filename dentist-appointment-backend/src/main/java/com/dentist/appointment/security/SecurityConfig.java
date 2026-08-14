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
import java.util.List;
import org.springframework.security.config.Customizer;
import org.springframework.http.HttpMethod;

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
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/api/users/**").permitAll()

                        //hem kök adresi hem de alt adresleri ekledim
                        .requestMatchers("/api/appointments", "/api/appointments/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        .anyRequest().authenticated()
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

        // allowCredentials(true) varken allowedOrigins("*") kullanılamaz.
        // Bu yüzden en güvenli yöntem olan "allowedOriginPatterns" kullanıyoruz:
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}