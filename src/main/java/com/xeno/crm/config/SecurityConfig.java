package com.xeno.crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean googleEnabled = googleClientId != null && !googleClientId.isBlank();
        http.csrf(csrf -> csrf.disable());
        if (!googleEnabled) {
            // Dev mode: permit all
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
            http
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/", "/index.html", "/assets/**", "/static/**",
                        "/api/public/**", "/login**"
                    ).permitAll()
                    .anyRequest().authenticated()
                )
                .oauth2Login(Customizer.withDefaults())
                .logout(logout -> logout.logoutSuccessUrl("/").permitAll());
        }
        return http.build();
    }
}


