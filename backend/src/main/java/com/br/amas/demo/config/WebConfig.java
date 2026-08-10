package com.br.amas.demo.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**

 * Configuração global de CORS.

 * Permite que o front-end (qualquer origem local ou servidor)

 * consuma a API sem erros de bloqueio de requisição.

 *

 * ⚠️  Em produção, substitua "*" pela URL real do front-end.

 *     Ex.: .allowedOrigins("https://sistema-amas.com.br")

 */

@Configuration

public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")           // qualquer origem em desenvolvimento
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String frontendLocation = resolveFrontendLocation();
        if (frontendLocation == null) {
            return;
        }

        registry.addResourceHandler("/**")
                .addResourceLocations(frontendLocation, "classpath:/static/");
    }

    private String resolveFrontendLocation() {
        Path currentDir = Paths.get("").toAbsolutePath().normalize();
        Path[] candidates = new Path[] {
                currentDir.resolve("frontend"),
                currentDir.resolve("../frontend").normalize()
        };

        for (Path candidate : candidates) {
            if (Files.isDirectory(candidate)) {
                return candidate.toUri().toString();
            }
        }

        return null;
    }

}
