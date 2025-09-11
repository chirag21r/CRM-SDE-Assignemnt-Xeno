package com.xeno.crm.service;

import com.xeno.crm.model.*;
import com.xeno.crm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CampaignService {
    private final CampaignRepository campaignRepository;
    private final SegmentRepository segmentRepository;
    private final CustomerRepository customerRepository;
    private final CommunicationLogRepository logRepository;
    private final RuleEvaluator ruleEvaluator = new RuleEvaluator();

    public CampaignService(CampaignRepository campaignRepository,
                           SegmentRepository segmentRepository,
                           CustomerRepository customerRepository,
                           CommunicationLogRepository logRepository) {
        this.campaignRepository = campaignRepository;
        this.segmentRepository = segmentRepository;
        this.customerRepository = customerRepository;
        this.logRepository = logRepository;
    }

    @Transactional
    public Campaign createAndQueue(Long segmentId, String name, String message) {
        Segment segment = segmentRepository.findById(segmentId)
                .orElseThrow(() -> new IllegalArgumentException("Segment not found"));
        Campaign campaign = new Campaign();
        campaign.setName(name);
        campaign.setMessage(message);
        campaign.setSegment(segment);
        campaign = campaignRepository.save(campaign);

        // Precompute logs as PENDING for matched users
        String ruleJson = segment.getRuleJson();
        List<Customer> customers = customerRepository.findAll();
        for (Customer c : customers) {
            if (ruleEvaluator.matches(c, ruleJson)) {
                CommunicationLog log = new CommunicationLog();
                log.setCampaign(campaign);
                log.setCustomer(c);
                log.setStatus(CommunicationLog.Status.PENDING);
                logRepository.save(log);
            }
        }
        return campaign;
    }

    public List<Campaign> listCampaigns() {
        return campaignRepository.findAll();
    }
}


