package com.br.amas.demo.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
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

    /**
     * Origens autorizadas a chamar a API pelo navegador, separadas por vírgula.
     * Pode ser trocada no Render pela variável CORS_ORIGINS.
     */
    @Value("${amas.cors.origins:https://amas-flax.vercel.app,https://amas-flax-*.vercel.app,http://localhost:*,http://127.0.0.1:*}")
    private String origensPermitidas;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origens = java.util.Arrays.stream(origensPermitidas.split(","))
                .map(String::trim).filter(o -> !o.isEmpty()).toArray(String[]::new);
        registry.addMapping("/api/**")
                .allowedOriginPatterns(origens)       // Vercel (produção) e ambiente local
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
