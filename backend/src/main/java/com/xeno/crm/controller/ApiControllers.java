package com.xeno.crm.controller;

import com.xeno.crm.model.*;
import com.xeno.crm.repository.*;
import com.xeno.crm.service.CampaignService;
import com.xeno.crm.service.VendorSimulatorService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiControllers {
    private static final Logger log = LoggerFactory.getLogger(ApiControllers.class);
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
        log.debug("POST /api/customers name={} email={}", c.getName(), c.getEmail());
        return customerRepository.save(c);
    }
    @PostMapping("/orders")
    public Order createOrder(@Valid @RequestBody Map<String, Object> body) {
        log.debug("POST /api/orders body={}", body);
        Long customerId = Long.valueOf(body.get("customerId").toString());
        Double amount = Double.valueOf(body.get("amount").toString());
        Customer c = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        Order o = new Order();
        o.setCustomer(c);
        o.setAmount(amount);
        if (body.get("date") != null) {
            try {
                java.time.LocalDateTime dt = java.time.LocalDateTime.parse(body.get("date").toString());
                o.setCreatedAt(dt);
            } catch (Exception ignore) {}
        }
        // update aggregates
        c.setTotalSpend((c.getTotalSpend() == null ? 0.0 : c.getTotalSpend()) + amount);
        c.setTotalVisits((c.getTotalVisits() == null ? 0 : c.getTotalVisits()) + 1);
        c.setLastActiveAt(java.time.LocalDateTime.now());
        customerRepository.save(c);
        return orderRepository.save(o);
    }

    // Lists & search
    @GetMapping("/customers")
    public List<Customer> listCustomers(@RequestParam(name = "search", required = false) String search) {
        log.debug("GET /api/customers search={}", search);
        List<Customer> all = customerRepository.findAll();
        if (search == null || search.isBlank()) return all;
        String q = search.toLowerCase();
        return all.stream().filter(c ->
                (c.getName() != null && c.getName().toLowerCase().contains(q)) ||
                (c.getEmail() != null && c.getEmail().toLowerCase().contains(q))
        ).toList();
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> listOrders(@RequestParam(name = "customerId", required = false) Long customerId) {
        log.debug("GET /api/orders customerId={}", customerId);
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .filter(o -> customerId == null || (o.getCustomer() != null && o.getCustomer().getId().equals(customerId)))
                .map(o -> Map.<String, Object>of(
                        "id", o.getId(),
                        "customerId", o.getCustomer() != null ? o.getCustomer().getId() : null,
                        "customerName", o.getCustomer() != null ? o.getCustomer().getName() : null,
                        "customerEmail", o.getCustomer() != null ? o.getCustomer().getEmail() : null,
                        "amount", o.getAmount(),
                        "date", o.getCreatedAt()))
                .toList();
    }

    // 2) Segment creation
    @PostMapping("/segments")
    public Segment createSegment(@Valid @RequestBody Segment s) {
        log.debug("POST /api/segments name={}", s.getName());
        return segmentRepository.save(s);
    }
    @GetMapping("/segments")
    public List<Segment> listSegments() {
        log.debug("GET /api/segments");
        return segmentRepository.findAll();
    }
    @PostMapping("/segments/preview")
    public Map<String, Object> previewRaw(@RequestBody Map<String, Object> body) {
        log.debug("POST /api/segments/preview body.keys={}", body.keySet());
        String ruleJson = Objects.toString(body.get("ruleJson"), "");
        List<Customer> customers = customerRepository.findAll();
        com.xeno.crm.service.RuleEvaluator evaluator = new com.xeno.crm.service.RuleEvaluator();
        long count = customers.stream().filter(c -> evaluator.matches(c, ruleJson)).count();
        return Map.<String, Object>of("audienceSize", count);
    }
    @GetMapping("/segments/{id}/preview-size")
    public Map<String, Object> previewSegment(@PathVariable Long id) {
        log.debug("GET /api/segments/{}/preview-size", id);
        Segment s = segmentRepository.findById(id).orElseThrow();
        List<Customer> customers = customerRepository.findAll();
        com.xeno.crm.service.RuleEvaluator evaluator = new com.xeno.crm.service.RuleEvaluator();
        long count = customers.stream().filter(c -> evaluator.matches(c, s.getRuleJson())).count();
        return Map.<String, Object>of("segmentId", id, "audienceSize", count);
    }

    // 3) Campaign creation/trigger
    @PostMapping("/campaigns")
    public Campaign createCampaign(@RequestBody Map<String, Object> body) {
        log.debug("POST /api/campaigns body={}", body);
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
        log.debug("POST /api/vendor/send/{}", campaignId);
        List<CommunicationLog> logs = logRepository.findByCampaignId(campaignId);
        int sent = 0, failed = 0;
        for (CommunicationLog log : logs) {
            if (log.getStatus() == CommunicationLog.Status.PENDING) {
                vendorSimulatorService.sendMessage(log);
                if (log.getStatus() == CommunicationLog.Status.SENT) sent++; else failed++;
            }
        }
        return Map.<String, Object>of(
            "campaignId", campaignId,
            "sent", sent,
            "failed", failed,
            "total", logs.size()
        );
    }

    // 3c) Delivery receipt endpoint (vendor calls back)
    @PostMapping("/vendor/receipt")
    public ResponseEntity<?> deliveryReceipt(@RequestBody Map<String, Object> body) {
        log.debug("POST /api/vendor/receipt body={}", body);
        String vendorId = Objects.toString(body.get("vendorMessageId"), null);
        String status = Objects.toString(body.get("status"), "SENT");
        return logRepository.findByVendorMessageId(vendorId)
                .map(log -> {
                    log.setStatus("SENT".equalsIgnoreCase(status) ? CommunicationLog.Status.SENT : CommunicationLog.Status.FAILED);
                    logRepository.save(log);
                    return ResponseEntity.ok(Map.<String, Object>of("ok", true));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(Map.<String, Object>of("error", "vendorMessageId not found")));
    }

    // Campaign logs (for details view)
    @GetMapping("/campaigns/{id}/logs")
    public List<Map<String, Object>> campaignLogs(@PathVariable Long id) {
        log.debug("GET /api/campaigns/{}/logs", id);
        List<CommunicationLog> logs = logRepository.findByCampaignId(id);
        return logs.stream().map(l -> Map.<String, Object>of(
                "id", l.getId(),
                "customerId", l.getCustomer()!=null? l.getCustomer().getId(): null,
                "customerName", l.getCustomer()!=null? l.getCustomer().getName(): null,
                "customerEmail", l.getCustomer()!=null? l.getCustomer().getEmail(): null,
                "status", l.getStatus().name(),
                "vendorMessageId", l.getVendorMessageId(),
                "updatedAt", l.getUpdatedAt()
        )).toList();
    }

    // 4) Simple campaign stats for history page
    @GetMapping("/campaigns/{id}/stats")
    public Map<String, Object> campaignStats(@PathVariable Long id) {
        log.debug("GET /api/campaigns/{}/stats", id);
        long sent = logRepository.countByCampaignIdAndStatus(id, CommunicationLog.Status.SENT);
        long failed = logRepository.countByCampaignIdAndStatus(id, CommunicationLog.Status.FAILED);
        long total = sent + failed + logRepository.countByCampaignIdAndStatus(id, CommunicationLog.Status.PENDING);
        return Map.<String, Object>of("sent", sent, "failed", failed, "total", total);
    }

    // Dashboard stats
    @GetMapping("/dashboard/stats")
    public Map<String, Object> dashboardStats() {
        log.debug("GET /api/dashboard/stats");
        long totalCustomers = customerRepository.count();
        long totalOrders = orderRepository.count();
        long totalCampaigns = campaignService.listCampaigns().size();
        Double totalIncome = orderRepository.sumAmount();
        List<Campaign> campaigns = campaignService.listCampaigns();
        Map<String, Object> last = Map.of();
        if (!campaigns.isEmpty()) {
            Campaign c = campaigns.get(campaigns.size()-1);
            long sent = logRepository.countByCampaignIdAndStatus(c.getId(), CommunicationLog.Status.SENT);
            long failed = logRepository.countByCampaignIdAndStatus(c.getId(), CommunicationLog.Status.FAILED);
            long total = sent + failed + logRepository.countByCampaignIdAndStatus(c.getId(), CommunicationLog.Status.PENDING);
            last = Map.<String, Object>of("id", c.getId(), "name", c.getName(), "sent", sent, "failed", failed, "total", total);
        }
        return Map.<String, Object>of(
                "totalCustomers", totalCustomers,
                "totalOrders", totalOrders,
                "totalCampaigns", totalCampaigns,
                "totalIncome", totalIncome,
                "lastCampaign", last
        );
    }

    // Public health (+auth flag)
    @GetMapping("/public/health")
    public Map<String, Object> health(@Value("${GOOGLE_CLIENT_ID:}") String googleId,
                                      @Value("${GOOGLE_CLIENT_SECRET:}") String googleSecret,
                                      @Value("${app.frontend.url:}") String frontendUrl) {
        boolean hasId = googleId != null && !googleId.isBlank();
        boolean hasSecret = googleSecret != null && !googleSecret.isBlank();
        boolean authEnabled = hasId && hasSecret;
        log.debug("GET /api/public/health authEnabled={} frontendUrl={} hasClientId={} hasClientSecret={}",
                authEnabled, frontendUrl, hasId, hasSecret);
        return Map.<String, Object>of("status", "ok", "authEnabled", authEnabled, "frontendUrl", frontendUrl);
    }

    // Current user (for frontend auth check)
    @GetMapping("/me")
    public ResponseEntity<?> me(java.security.Principal principal) {
        log.debug("GET /api/me principal={}", principal != null ? principal.getName() : null);
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.<String, Object>of("error", "unauthenticated"));
        }
        return ResponseEntity.ok(Map.<String, Object>of("name", principal.getName()));
    }
}


