package com.br.amas.demo.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

import java.math.RoundingMode;

/**

 * Motor Financeiro Progressivo da AMAS.

 *

 * Faixa 1: líquida ≤ R$5.000      → Isento (R$0)

 * Faixa 2: R$5k < líq. ≤ R$10k   → R$100 fixo OU 2% (o maior)

 * Faixa 3: líquida > R$10.000     → alíquota do contrato (padrão 5%)

 * Gamificação: empresa com "Clube de Benefícios" paga 3% em vez de 5%

 */

@Component

public class MotorFinanceiroService {

    private static final BigDecimal LIMITE_F1  = new BigDecimal("5000");

    private static final BigDecimal LIMITE_F2  = new BigDecimal("10000");

    private static final BigDecimal FIXO_F2    = new BigDecimal("100");

    private static final BigDecimal PERC_F2    = new BigDecimal("0.02");

    private static final BigDecimal PERC_F3_PADRAO = new BigDecimal("0.05");

    private static final BigDecimal PERC_F3_CLUBE  = new BigDecimal("0.03");

    public ResultadoCalculo calcular(BigDecimal rendaLiquida,

                                     BigDecimal aliquotaContrato,

                                     boolean clubeDeBeneficios) {

        if (rendaLiquida == null || rendaLiquida.compareTo(BigDecimal.ZERO) <= 0) {

            return new ResultadoCalculo(BigDecimal.ZERO, 1, BigDecimal.ZERO, true);

        }

        // Faixa 1 – Isento

        if (rendaLiquida.compareTo(LIMITE_F1) <= 0) {

            return new ResultadoCalculo(BigDecimal.ZERO, 1, BigDecimal.ZERO, true);

        }

        // Faixa 2 – R$100 ou 2%, o maior

        if (rendaLiquida.compareTo(LIMITE_F2) <= 0) {

            BigDecimal por2pct = rendaLiquida.multiply(PERC_F2).setScale(2, RoundingMode.HALF_UP);

            BigDecimal valor   = por2pct.compareTo(FIXO_F2) >= 0 ? por2pct : FIXO_F2;

            BigDecimal aliq    = valor.divide(rendaLiquida, 4, RoundingMode.HALF_UP)

                    .multiply(BigDecimal.valueOf(100))

                    .setScale(2, RoundingMode.HALF_UP);

            return new ResultadoCalculo(valor, 2, aliq, false);

        }

        // Faixa 3 – alíquota contratual ou gamificação

        BigDecimal perc;

        if (aliquotaContrato != null && aliquotaContrato.compareTo(BigDecimal.ZERO) > 0) {

            perc = aliquotaContrato.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        } else {

            perc = clubeDeBeneficios ? PERC_F3_CLUBE : PERC_F3_PADRAO;

        }

        BigDecimal valor = rendaLiquida.multiply(perc).setScale(2, RoundingMode.HALF_UP);

        BigDecimal aliq  = perc.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);

        return new ResultadoCalculo(valor, 3, aliq, false);

    }

    /** DTO de resultado do cálculo */

    public record ResultadoCalculo(

            BigDecimal valorDevido,

            int faixa,

            BigDecimal aliquotaAplicada,

            boolean isento

    ) {}

}
