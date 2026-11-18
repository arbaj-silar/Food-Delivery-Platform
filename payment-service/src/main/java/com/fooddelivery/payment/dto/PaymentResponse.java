package com.fooddelivery.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fooddelivery.payment.enums.PaymentMethod;
import com.fooddelivery.payment.enums.PaymentStatus;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;

    private Long orderId;

    private String customerId;

    private BigDecimal amount;

    private PaymentMethod paymentMethod;

    private PaymentStatus paymentStatus;

    private String transactionReference;

    private String failureReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}