package com.br.amas.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // ---------------------------------------------------------
                // CSRF
                // ---------------------------------------------------------
                // Desativado porque o sistema utiliza uma API REST própria
                // e o frontend não trabalha com formulário de login do
                // Spring Security.
                .csrf(csrf -> csrf.disable())

                // ---------------------------------------------------------
                // AUTORIZAÇÃO
                // ---------------------------------------------------------
                // Por enquanto, todas as requisições são permitidas.
                // A autenticação continua sendo feita pelo AuthService.
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )

                // ---------------------------------------------------------
                // LOGIN DO SPRING SECURITY
                // ---------------------------------------------------------
                // Desabilita a tela automática de login do Spring Security.
                .formLogin(form -> form.disable())

                // ---------------------------------------------------------
                // HTTP BASIC
                // ---------------------------------------------------------
                // Desabilita o Basic Auth automático.
                .httpBasic(basic -> basic.disable())

                // ---------------------------------------------------------
                // LOGOUT DO SPRING SECURITY
                // ---------------------------------------------------------
                .logout(logout -> logout.disable());

        return http.build();
    }
}