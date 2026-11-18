
package com.fooddelivery.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CreateDeliveryEarningRequest {

    private Long deliveryAssignmentId;

    private Long orderId;

    private Long deliveryPartnerId;

    private BigDecimal amount;

    private LocalDateTime completedAt;
}
