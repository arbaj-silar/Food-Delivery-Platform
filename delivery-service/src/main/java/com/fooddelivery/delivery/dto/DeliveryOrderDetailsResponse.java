package com.fooddelivery.delivery.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DeliveryOrderDetailsResponse {

    private Long id;

    private String customerId;

    private Long restaurantId;

    private String deliveryAddress;
    
    private BigDecimal deliveryLatitude;

    private BigDecimal deliveryLongitude;
    
    private BigDecimal restaurantLatitude;

    private BigDecimal restaurantLongitude;

    private BigDecimal totalAmount;

    private String status;
}