package com.br.amas.demo.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;

@Component
@RequiredArgsConstructor
public class SolicitacaoSchemaMigration {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    void allowNullCpfOnSolicitacoes() {
        try (Connection connection = dataSource.getConnection()) {
            if (!isMySql(connection) || isCpfAlreadyNullable(connection)) {
                return;
            }
            jdbcTemplate.execute("ALTER TABLE solicitacoes MODIFY COLUMN cpf VARCHAR(255) NULL");
        } catch (Exception ignored) {
            // If the table is not ready yet or the database is unavailable, try again when the app is ready.
        }
    }

    @PostConstruct
    void tryDuringStartup() {
        allowNullCpfOnSolicitacoes();
    }

    @EventListener(ApplicationReadyEvent.class)
    void ensureOnApplicationReady() {
        allowNullCpfOnSolicitacoes();
    }

    private boolean isMySql(Connection connection) throws Exception {
        String databaseProduct = connection.getMetaData().getDatabaseProductName();
        return databaseProduct != null && databaseProduct.toLowerCase().contains("mysql");
    }

    private boolean isCpfAlreadyNullable(Connection connection) throws Exception {
        String schema = connection.getCatalog();
        try (ResultSet columns = connection.getMetaData().getColumns(schema, null, "solicitacoes", "cpf")) {
            if (!columns.next()) {
                return true;
            }
            return columns.getInt("NULLABLE") == java.sql.DatabaseMetaData.columnNullable;
        }
    }
}
