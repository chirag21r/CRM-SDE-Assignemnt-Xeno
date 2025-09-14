package com.xeno.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class KeepAliveService {
    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${app.frontend.url:https://mini-crm-iqd4.onrender.com}")
    private String frontendUrl;
    
    @Value("${app.backend.url:https://crm-sde-assignemnt-xeno.onrender.com}")
    private String backendUrl;
    
    // Ping keep-alive endpoint every 10 minutes to prevent sleep
    @Scheduled(fixedRate = 600000) // 10 minutes in milliseconds
    public void keepAlive() {
        try {
            String keepAliveUrl = backendUrl + "/api/public/keepalive";
            log.debug("Pinging keep-alive endpoint: {}", keepAliveUrl);
            
            var response = restTemplate.getForObject(keepAliveUrl, java.util.Map.class);
            log.debug("Keep-alive response: {}", response);
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
    
    // Also ping frontend to keep it awake
    @Scheduled(fixedRate = 300000) // 5 minutes in milliseconds
    public void keepFrontendAlive() {
        try {
            log.debug("Pinging frontend to keep it awake: {}", frontendUrl);
            restTemplate.getForObject(frontendUrl, String.class);
        } catch (Exception e) {
            log.warn("Frontend keep-alive ping failed: {}", e.getMessage());
        }
    }
}
