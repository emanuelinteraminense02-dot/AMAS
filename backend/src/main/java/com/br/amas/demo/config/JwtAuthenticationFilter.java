package com.br.amas.demo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty() || !jwtService.validarToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String email = jwtService.extrairEmail(token);
            String perfil = jwtService.extrairPerfil(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String role = (perfil != null ? perfil.toUpperCase() : "ASSOCIADO");
                if (!role.startsWith("ROLE_")) {
                    role = "ROLE_" + role;
                }

                List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority(role)
                );

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        authorities
                );
                java.util.Map<String, Object> detalhes = new java.util.HashMap<>();
                detalhes.put("id", jwtService.extrairId(token));
                detalhes.put("perfil", perfil != null ? perfil.toLowerCase() : "associado");
                detalhes.put("ip", request.getRemoteAddr());
                authentication.setDetails(detalhes);

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.warn("[JWT FILTER] Falha ao processar token: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
