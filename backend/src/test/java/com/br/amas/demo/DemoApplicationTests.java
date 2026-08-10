package com.br.amas.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Teste de sanidade da aplicação.
 *
 * Para rodar sem MySQL, configure as variáveis de ambiente:
 *   SPRING_DATASOURCE_URL=jdbc:h2:mem:amas_db;MODE=MySQL
 *   SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver
 *   SPRING_DATASOURCE_USERNAME=sa
 *   SPRING_DATASOURCE_PASSWORD=
 *   SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.H2Dialect
 */
@SpringBootTest
class DemoApplicationTests {

    @Test
    void contextLoads() {
        // Verifica que o contexto Spring inicializa corretamente
    }
}
