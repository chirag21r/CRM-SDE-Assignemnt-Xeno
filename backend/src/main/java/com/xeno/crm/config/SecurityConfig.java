package com.xeno.crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean googleEnabled = googleClientId != null && !googleClientId.isBlank();
        http.csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults());
        if (!googleEnabled) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
            http
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/", "/index.html", "/assets/**", "/static/**",
                        "/api/public/**", "/api/ai/**", "/login**", "/oauth2/**"
                    ).permitAll()
                    .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                    .successHandler((req, res, auth) -> {
                        res.sendRedirect(frontendUrl + "/#/?login=1");
                    })
                    .failureHandler((req, res, ex) -> {
                        log.error("OAuth2 login failed: {}", ex.getMessage());
                        String reason = java.net.URLEncoder.encode(String.valueOf(ex.getMessage()), java.nio.charset.StandardCharsets.UTF_8);
                        res.sendRedirect(frontendUrl + "/#/?login=0&reason=" + reason);
                    })
                )
                .logout(logout -> logout.logoutSuccessUrl("/").permitAll());
        }
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}


