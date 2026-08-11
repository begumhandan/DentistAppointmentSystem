package com.dentist.appointment.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    // Token'ları şifrelemek ve çözmek için kullanacağımız 256-bit (Base64) gizli anahtarımız.
    // DİKKAT: Gerçek bir projede bu anahtar koda yazılmaz, application.properties içine saklanır!
    @Value("${application.security.jwt.secret-key}")
    private String SECRET_KEY;

    //token içinden email çıkaran metod
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // kullanıcı başarılı giriş yaptığında üret token
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    // Token içine ekstra bilgiler (Roller) ekleyerek Token üreten metod
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis())) // Token'ın veriliş zamanı(now)
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 Saat geçerli
                .signWith(getSignInKey(), SignatureAlgorithm.HS256) // Şifreleme alg
                .compact();
    }

    // gelen token bizim sistemimize mi ait olduğunu ve süresinin geçip geçmediğini kontrol eden
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    // token süresinin dolup dolmadığını kontrol eder
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // token içindeki belirli bir veriyi okumamızı sağlayan genel metod
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // token şifresini çözüp içindeki tüm verilere ulaştığımız yer
    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // bizim string halindeki SECRET_KEY jwt kütüphanesinin anlayacağı formata çeviren metod
    private Key getSignInKey() {
        // Artık SECRET_KEY yerine yukarıdaki secretKey değişkenini okuyor
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}