package com.fooddelivery.delivery.dto;

import java.time.LocalDateTime;

import com.fooddelivery.delivery.enums.AvailabilityStatus;
import com.fooddelivery.delivery.enums.VehicleType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryPartnerResponse {

    private Long id;

    private String keycloakUserId;

    private String fullName;

    private String phone;

    private VehicleType vehicleType;

    private AvailabilityStatus availabilityStatus;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}