package com.fooddelivery.delivery.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryPartnerStatsResponse {

    private long totalAssignments;

    private long assignedDeliveries;

    private long acceptedDeliveries;

    private long pickedUpDeliveries;

    private long outForDelivery;

    private long completedDeliveries;

    private long rejectedDeliveries;

    private long cancelledDeliveries;

    private long activeDeliveries;
}