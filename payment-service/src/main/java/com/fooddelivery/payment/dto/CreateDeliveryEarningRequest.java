
package com.fooddelivery.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateDeliveryEarningRequest {

    @NotNull
    @Positive
    private Long deliveryAssignmentId;

    @NotNull
    @Positive
    private Long orderId;

    @NotNull
    @Positive
    private Long deliveryPartnerId;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal amount;

    @NotNull
    private LocalDateTime completedAt;
}
