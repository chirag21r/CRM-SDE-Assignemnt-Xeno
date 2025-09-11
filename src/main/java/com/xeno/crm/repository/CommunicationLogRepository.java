package com.xeno.crm.repository;

import com.xeno.crm.model.CommunicationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommunicationLogRepository extends JpaRepository<CommunicationLog, Long> {
    List<CommunicationLog> findByCampaignId(Long campaignId);
    long countByCampaignIdAndStatus(Long campaignId, CommunicationLog.Status status);
    Optional<CommunicationLog> findByVendorMessageId(String vendorMessageId);
}


