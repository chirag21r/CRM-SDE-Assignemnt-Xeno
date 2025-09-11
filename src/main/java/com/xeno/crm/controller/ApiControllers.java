package com.xeno.crm.controller;

import com.xeno.crm.model.*;
import com.xeno.crm.repository.*;
import com.xeno.crm.service.CampaignService;
import com.xeno.crm.service.VendorSimulatorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiControllers {
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final SegmentRepository segmentRepository;
    private final CommunicationLogRepository logRepository;
    private final CampaignService campaignService;
    private final VendorSimulatorService vendorSimulatorService;

    public ApiControllers(CustomerRepository customerRepository,
                          OrderRepository orderRepository,
                          SegmentRepository segmentRepository,
                          CommunicationLogRepository logRepository,
                          CampaignService campaignService,
                          VendorSimulatorService vendorSimulatorService) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.segmentRepository = segmentRepository;
        this.logRepository = logRepository;
        this.campaignService = campaignService;
        this.vendorSimulatorService = vendorSimulatorService;
    }

    // 1) Ingestion APIs
    @PostMapping("/customers")
    public Customer createCustomer(@Valid @RequestBody Customer c) {
        return customerRepository.save(c);
    }
    @PostMapping("/orders")
    public Order createOrder(@Valid @RequestBody Map<String, Object> body) {
        Long customerId = Long.valueOf(body.get("customerId").toString());
        Double amount = Double.valueOf(body.get("amount").toString());
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        Order o = new Order();
        o.setCustomer(c);
        o.setAmount(amount);
        // update aggregates
        c.setTotalSpend((c.getTotalSpend() == null ? 0.0 : c.getTotalSpend()) + amount);
        c.setTotalVisits((c.getTotalVisits() == null ? 0 : c.getTotalVisits()) + 1);
        c.setLastActiveAt(java.time.LocalDateTime.now());
        customerRepository.save(c);
        return orderRepository.save(o);
    }

    // 2) Segment creation
    @PostMapping("/segments")
    public Segment createSegment(@Valid @RequestBody Segment s) {
        return segmentRepository.save(s);
    }
    @GetMapping("/segments/{id}/preview-size")
    public Map<String, Object> previewSegment(@PathVariable Long id) {
        Segment s = segmentRepository.findById(id).orElseThrow();
        List<Customer> customers = customerRepository.findAll();
        com.xeno.crm.service.RuleEvaluator evaluator = new com.xeno.crm.service.RuleEvaluator();
        long count = customers.stream().filter(c -> evaluator.matches(c, s.getRuleJson())).count();
        return Map.of("segmentId", id, "audienceSize", count);
    }

    // 3) Campaign creation/trigger
    @PostMapping("/campaigns")
    public Campaign createCampaign(@RequestBody Map<String, Object> body) {
        Long segmentId = Long.valueOf(body.get("segmentId").toString());
        String name = Objects.toString(body.get("name"), "Campaign");
        String message = Objects.toString(body.get("message"), "Hi {name}, here’s 10% off!");
        return campaignService.createAndQueue(segmentId, name, message);
    }
    @GetMapping("/campaigns")
    public List<Campaign> listCampaigns() { return campaignService.listCampaigns(); }

    // 3b) Vendor simulate send for PENDING logs
    @PostMapping("/vendor/send/{campaignId}")
    public Map<String, Object> simulateVendor(@PathVariable Long campaignId) {
        List<CommunicationLog> logs = logRepository.findByCampaignId(campaignId);
        int sent = 0, failed = 0;
        for (CommunicationLog log : logs) {
            if (log.getStatus() == CommunicationLog.Status.PENDING) {
                vendorSimulatorService.sendMessage(log);
                if (log.getStatus() == CommunicationLog.Status.SENT) sent++; else failed++;
            }
        }
        return Map.of(
            "campaignId", campaignId,
            "sent", sent,
            "failed", failed,
            "total", logs.size()
        );
    }

    // 3c) Delivery receipt endpoint (vendor calls back)
    @PostMapping("/vendor/receipt")
    public ResponseEntity<?> deliveryReceipt(@RequestBody Map<String, Object> body) {
        String vendorId = Objects.toString(body.get("vendorMessageId"), null);
        String status = Objects.toString(body.get("status"), "SENT");
        return logRepository.findByVendorMessageId(vendorId)
                .map(log -> {
                    log.setStatus("SENT".equalsIgnoreCase(status) ? CommunicationLog.Status.SENT : CommunicationLog.Status.FAILED);
                    logRepository.save(log);
                    return ResponseEntity.ok(Map.of("ok", (Object) true));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.of("error", (Object) "vendorMessageId not found")));
    }

    // 4) Simple campaign stats for history page
    @GetMapping("/campaigns/{id}/stats")
    public Map<String, Object> campaignStats(@PathVariable Long id) {
        long sent = logRepository.countByCampaignIdAndStatus(id, CommunicationLog.Status.SENT);
        long failed = logRepository.countByCampaignIdAndStatus(id, CommunicationLog.Status.FAILED);
        long total = sent + failed + logRepository.countByCampaignIdAndStatus(id, CommunicationLog.Status.PENDING);
        return Map.of("sent", sent, "failed", failed, "total", total);
    }

    // Public health
    @GetMapping("/public/health")
    public Map<String, String> health() { return Map.of("status", "ok"); }
}


