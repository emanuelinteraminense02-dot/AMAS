package com.br.amas.demo.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${amas.jwt.secret:amas_super_secret_jwt_key_2026_sao_sebastiao_df_amas_key_min_256bits_length}") String secret,
            @Value("${amas.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMs = expirationMs;
    }

    public String gerarToken(Long id, String email, String nome, String perfil) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", id);
        claims.put("nome", nome);
        claims.put("perfil", perfil);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validarToken(String token) {
        try {
            Claims claims = extrairClaims(token);
            return claims.getExpiration() != null && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extrairEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    public String extrairPerfil(String token) {
        Object perfil = extrairClaims(token).get("perfil");
        return perfil != null ? perfil.toString() : null;
    }

    public Long extrairId(String token) {
        Object id = extrairClaims(token).get("id");
        if (id instanceof Number num) {
            return num.longValue();
        } else if (id != null) {
            try {
                return Long.parseLong(id.toString());
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }
}
