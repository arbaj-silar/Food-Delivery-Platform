package com.fooddelivery.delivery.dto;

import com.fooddelivery.delivery.enums.AvailabilityStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AvailabilityRequest {

    @NotNull(message = "Availability status is required")
    private AvailabilityStatus availabilityStatus;
}