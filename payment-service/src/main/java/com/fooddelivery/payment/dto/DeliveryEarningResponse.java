package com.fooddelivery.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fooddelivery.payment.enums.EarningStatus;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryEarningResponse {

    private Long id;

    private Long deliveryAssignmentId;

    private Long orderId;

    private Long deliveryPartnerId;

    private BigDecimal amount;

    private EarningStatus earningStatus;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
}