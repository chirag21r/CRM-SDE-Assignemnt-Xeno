package com.xeno.crm.config;

import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.boot.web.servlet.server.CookieSameSiteSupplier;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;
    
    @Value("${GOOGLE_CLIENT_SECRET:}")
    private String googleClientSecret;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @jakarta.annotation.PostConstruct
    public void logConfig() {
        boolean hasClientId = googleClientId != null && !googleClientId.isBlank();
        boolean hasClientSecret = googleClientSecret != null && !googleClientSecret.isBlank();
        log.info("SecurityConfig initialized with frontendUrl: {} hasClientId: {} hasClientSecret: {}", 
                frontendUrl, hasClientId, hasClientSecret);
        log.info("GOOGLE_CLIENT_ID env: {}", System.getenv("GOOGLE_CLIENT_ID") != null ? "SET" : "NOT_SET");
        log.info("GOOGLE_CLIENT_SECRET env: {}", System.getenv("GOOGLE_CLIENT_SECRET") != null ? "SET" : "NOT_SET");
        log.info("Resolved clientId: {}", googleClientId != null ? googleClientId.substring(0, Math.min(10, googleClientId.length())) + "..." : "null");
    }

    @Bean
    public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
        return new HttpSessionOAuth2AuthorizationRequestRepository();
    }

    @Bean
    public CookieSameSiteSupplier cookieSameSiteSupplier() {
        return CookieSameSiteSupplier.ofNone();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.info("Configuring SecurityFilterChain - AUTHENTICATION COMPLETELY DISABLED");
        
        // Disable all security and allow all requests
        http.csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Allow deployed frontend and localhost dev
        config.setAllowedOrigins(List.of(frontendUrl, "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}