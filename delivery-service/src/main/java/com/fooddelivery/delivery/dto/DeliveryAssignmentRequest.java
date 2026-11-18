package com.fooddelivery.delivery.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.Data;

@Data
public class DeliveryAssignmentRequest {

    @NotNull(message = "Order ID is required")
    @Positive(message = "Order ID must be positive")
    private Long orderId;

    @NotNull(message = "Delivery partner ID is required")
    @Positive(message = "Delivery partner ID must be positive")
    private Long deliveryPartnerId;
}