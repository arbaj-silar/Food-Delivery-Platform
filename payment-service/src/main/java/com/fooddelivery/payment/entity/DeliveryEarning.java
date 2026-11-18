package com.fooddelivery.payment.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fooddelivery.payment.enums.EarningStatus;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "delivery_earnings",
    indexes = {
        @Index(name = "idx_earning_partner_id", columnList = "delivery_partner_id"),
        @Index(name = "idx_earning_order_id", columnList = "order_id"),
        @Index(name = "idx_earning_completed_at", columnList = "completed_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryEarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "delivery_assignment_id", nullable = false, unique = true)
    private Long deliveryAssignmentId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "delivery_partner_id", nullable = false)
    private Long deliveryPartnerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EarningStatus earningStatus;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;

        if (earningStatus == null) {
            earningStatus = EarningStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}