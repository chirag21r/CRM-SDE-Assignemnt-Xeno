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

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @jakarta.annotation.PostConstruct
    public void logConfig() {
        log.info("SecurityConfig initialized with frontendUrl: {}", frontendUrl);
    }

    @Bean
    public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
        return new HttpSessionOAuth2AuthorizationRequestRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean googleEnabled = googleClientId != null && !googleClientId.isBlank();
        http.csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            );
        // Lightweight request logger for debugging auth/CORS
        http.addFilterBefore(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                           jakarta.servlet.http.HttpServletResponse response,
                                           jakarta.servlet.FilterChain filterChain)
                    throws java.io.IOException, jakarta.servlet.ServletException {
                try {
                    String path = request.getRequestURI();
                    if (path.startsWith("/api") || path.startsWith("/login") || path.startsWith("/oauth2")) {
                        String origin = request.getHeader("Origin");
                        String referer = request.getHeader("Referer");
                        String cookie = request.getHeader("Cookie");
                        log.info("REQ {} {} origin={} referer={} hasCookie={} cookie={}", 
                                request.getMethod(), path, origin, referer, cookie!=null, 
                                cookie != null ? cookie.substring(0, Math.min(100, cookie.length())) + "..." : "null");
                    }
                } catch (Exception ignore) {}
                filterChain.doFilter(request, response);
            }
        }, UsernamePasswordAuthenticationFilter.class);
        if (!googleEnabled) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
            http
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/", "/index.html", "/assets/**", "/static/**",
                        "/login**", "/oauth2/**"
                    ).permitAll()
                    .requestMatchers("/api/public/**", "/api/ai/**").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                    .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                    .defaultAuthenticationEntryPointFor((request, response, authException) -> {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        try (java.io.PrintWriter w = response.getWriter()) {
                            w.write("{\"error\":\"unauthenticated\"}");
                        }
                    }, new AntPathRequestMatcher("/api/**"))
                )
                .oauth2Login(oauth -> oauth
                    .authorizationEndpoint(authorization -> 
                        authorization.authorizationRequestRepository(authorizationRequestRepository())
                    )
                    .loginPage("/oauth2/authorization/google")
                    .successHandler((req, res, auth) -> {
                        log.info("OAuth2 login successful for user: {}", auth.getName());
                        // Force session creation
                        req.getSession(true);
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


