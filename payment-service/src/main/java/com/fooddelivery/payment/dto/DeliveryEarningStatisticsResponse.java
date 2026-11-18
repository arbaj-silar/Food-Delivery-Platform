package com.fooddelivery.payment.dto;

import java.math.BigDecimal;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryEarningStatisticsResponse {

    private BigDecimal totalEarnings;

    private BigDecimal todayEarnings;

    private BigDecimal monthlyEarnings;

    private BigDecimal pendingEarnings;

    private BigDecimal availableEarnings;

    private BigDecimal paidEarnings;

    private Long completedDeliveries;

    private BigDecimal averageEarningPerDelivery;
}