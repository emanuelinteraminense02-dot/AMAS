package com.br.amas.demo.service;

import java.security.SecureRandom;

/** Gera senhas temporárias aleatórias (substitui a antiga senha padrão 123456). */
public final class SenhaTemporaria {

    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private SenhaTemporaria() {}

    public static String gerar() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(ALFABETO.charAt(RANDOM.nextInt(ALFABETO.length())));
        }
        return sb.toString();
    }
}
