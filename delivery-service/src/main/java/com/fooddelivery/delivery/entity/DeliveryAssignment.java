package com.fooddelivery.delivery.entity;

import java.time.LocalDateTime;

import com.fooddelivery.delivery.enums.DeliveryStatus;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
	    name = "delivery_assignments",
	    indexes = {
	        @Index(name = "idx_delivery_order_id",
	               columnList = "order_id"),

	        @Index(name = "idx_delivery_partner_id",
	               columnList = "delivery_partner_id"),

	        @Index(name = "idx_delivery_partner_status",
	               columnList = "delivery_partner_id, status")
	    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Reference to Order Service. No cross-database foreign key.
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_partner_id", nullable = false)
    private DeliveryPartner deliveryPartner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.ASSIGNED;

    private LocalDateTime assignedAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime pickedUpAt;
    
    private LocalDateTime outForDeliveryAt;

    private LocalDateTime deliveredAt;

    @Column(length = 500)
    private String rejectionReason;

    @Column(length = 500)
    private String deliveryNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;

        if (assignedAt == null) {
            assignedAt = createdAt;
        }

        if (status == null) {
            status = DeliveryStatus.ASSIGNED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}