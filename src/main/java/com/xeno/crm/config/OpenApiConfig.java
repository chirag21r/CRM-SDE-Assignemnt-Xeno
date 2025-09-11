package com.xeno.crm.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI api() {
        return new OpenAPI()
                .info(new Info().title("Xeno Mini CRM API").version("v1"))
                .externalDocs(new ExternalDocumentation().description("Swagger UI").url("/swagger-ui.html"));
    }
}


