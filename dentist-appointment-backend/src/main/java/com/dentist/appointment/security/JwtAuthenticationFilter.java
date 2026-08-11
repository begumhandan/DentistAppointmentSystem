package com.dentist.appointment.security;

import com.dentist.appointment.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        //gelen isteğin başlığında "Authorization" var mı ve "Bearer " ile mi başlıyor?
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); //yoksa veya hatalıysa diğer filtrelere geç
            return;
        }

        // kendisini al ("Bearer " kelimesi 7 karakter olduğu için 7. indexten sonrasını kesiyorum)
        jwt = authHeader.substring(7);

        //token okuyup içindeki email çıkarıyoruz
        username = jwtService.extractUsername(jwt);

        //token bir isim yazıyorsa ve bu kişi sisteme henüz giriş yapmamışsa =context boş ise
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // databaseden bu kullanıcıyı bulup bilgilerini userdetails getir
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            //token gerçekten bu kullanıcıya mı ait, süresi dolmuş mu kontrol et
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // token geçerliyse spring securitynin tanıyacağı gerçek bir profil oluştur
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Güvenlik bağlamına kulanıcıyı koy
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        //işlem bittikten sonra isteği asıl gitmesi gereken yere yolla
        filterChain.doFilter(request, response);
    }
}