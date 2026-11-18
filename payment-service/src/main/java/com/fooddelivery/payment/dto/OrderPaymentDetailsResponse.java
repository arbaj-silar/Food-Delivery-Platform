package com.fooddelivery.payment.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderPaymentDetailsResponse {

    private Long id;

    private String customerId;

    private BigDecimal totalAmount;

    private String paymentStatus;
}