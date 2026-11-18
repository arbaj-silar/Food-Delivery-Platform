package com.fooddelivery.delivery.dto;

import java.time.LocalDateTime;

import com.fooddelivery.delivery.enums.DeliveryStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DeliveryTrackingResponse {

    private Long assignmentId;

    private Long orderId;

    private String deliveryPartnerName;

    private String deliveryPartnerPhone;

    private DeliveryStatus status;

    private LocalDateTime assignedAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime pickedUpAt;

    private LocalDateTime outForDeliveryAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime updatedAt;

    // Live GPS location
    private Double latitude;

    private Double longitude;

    private LocalDateTime locationUpdatedAt;
}