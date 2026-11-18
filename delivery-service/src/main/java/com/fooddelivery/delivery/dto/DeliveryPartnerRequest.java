package com.fooddelivery.delivery.dto;

import com.fooddelivery.delivery.enums.VehicleType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class DeliveryPartnerRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9]{10,15}$",
        message = "Enter a valid phone number"
    )
    private String phone;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;
}