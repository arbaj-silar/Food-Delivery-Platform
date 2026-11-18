package com.fooddelivery.delivery.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fooddelivery.delivery.entity.DeliveryAssignment;
import com.fooddelivery.delivery.enums.DeliveryStatus;

public interface DeliveryAssignmentRepository
        extends JpaRepository<DeliveryAssignment, Long> {

    Optional<DeliveryAssignment> findByOrderId(Long orderId);

    List<DeliveryAssignment> findByDeliveryPartnerIdOrderByCreatedAtDesc(
            Long deliveryPartnerId);

    List<DeliveryAssignment> findByDeliveryPartnerIdAndStatusOrderByCreatedAtDesc(
            Long deliveryPartnerId,
            DeliveryStatus status);

    long countByDeliveryPartnerId(Long deliveryPartnerId);

    long countByDeliveryPartnerIdAndStatus(
            Long deliveryPartnerId,
            DeliveryStatus status);

    long countByDeliveryPartnerIdAndStatusIn(
            Long deliveryPartnerId,
            List<DeliveryStatus> statuses);

    // Check whether the partner has an active delivery
    boolean existsByDeliveryPartnerIdAndStatusIn(
            Long deliveryPartnerId,
            List<DeliveryStatus> statuses);
}