package com.fooddelivery.order.dto;

import com.fooddelivery.order.enums.PaymentStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentStatusUpdateRequest {

    @NotNull
    private PaymentStatus paymentStatus;
}