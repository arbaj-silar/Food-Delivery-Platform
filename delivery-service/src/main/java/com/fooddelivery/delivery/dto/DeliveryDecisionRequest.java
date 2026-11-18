package com.fooddelivery.delivery.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeliveryDecisionRequest {

    @Size(max = 500, message = "Rejection reason cannot exceed 500 characters")
    private String rejectionReason;
}