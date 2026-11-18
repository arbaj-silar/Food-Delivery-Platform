package com.fooddelivery.payment.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fooddelivery.payment.entity.DeliveryEarning;
import com.fooddelivery.payment.enums.EarningStatus;

@Repository
public interface DeliveryEarningRepository
        extends JpaRepository<DeliveryEarning, Long> {

    List<DeliveryEarning> findByDeliveryPartnerIdOrderByCompletedAtDesc(
            Long deliveryPartnerId);

    List<DeliveryEarning> findByDeliveryPartnerIdAndEarningStatus(
            Long deliveryPartnerId,
            EarningStatus earningStatus);

    List<DeliveryEarning> findByDeliveryPartnerIdAndCompletedAtBetween(
            Long deliveryPartnerId,
            LocalDateTime start,
            LocalDateTime end);

    boolean existsByDeliveryAssignmentId(Long deliveryAssignmentId);
}