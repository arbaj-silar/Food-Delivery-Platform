package com.fooddelivery.delivery.dto;

import java.time.LocalDateTime;

import com.fooddelivery.delivery.enums.DeliveryStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryAssignmentResponse {

    private Long id;

    private Long orderId;

    private Long deliveryPartnerId;

    private String deliveryPartnerName;

    private DeliveryStatus status;

    private LocalDateTime assignedAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime pickedUpAt;

    private LocalDateTime deliveredAt;

    private String rejectionReason;

    private String deliveryNotes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}