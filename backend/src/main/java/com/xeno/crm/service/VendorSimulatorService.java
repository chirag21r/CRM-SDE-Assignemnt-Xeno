package com.xeno.crm.service;

import com.xeno.crm.model.CommunicationLog;
import com.xeno.crm.repository.CommunicationLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Random;
import java.util.UUID;

@Service
public class VendorSimulatorService {
    private final CommunicationLogRepository logRepository;
    private final Random random = new Random();
    private final RestTemplate restTemplate;
    @org.springframework.beans.factory.annotation.Value("${server.port:8080}")
    private int serverPort;
    @org.springframework.beans.factory.annotation.Value("${app.vendor.successRate:0.9}")
    private double successRate;

    public VendorSimulatorService(CommunicationLogRepository logRepository, RestTemplate restTemplate) {
        this.logRepository = logRepository;
        this.restTemplate = restTemplate;
    }

    public String sendMessage(CommunicationLog log) {
        // 90% success, 10% failure
        boolean success = random.nextDouble() < successRate;
        String vendorId = UUID.randomUUID().toString();
        log.setVendorMessageId(vendorId);
        log.setStatus(success ? CommunicationLog.Status.SENT : CommunicationLog.Status.FAILED);
        if (!success) {
            log.setFailureReason("Simulated vendor failure");
        }
        logRepository.save(log);
        try {
            restTemplate.postForEntity("http://localhost:" + serverPort + "/api/vendor/receipt",
                java.util.Map.of("vendorMessageId", vendorId, "status", success ? "SENT" : "FAILED"),
                Void.class);
        } catch (Exception ignore) {}
        return vendorId;
    }
}


