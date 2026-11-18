package com.fooddelivery.order.dto;

import java.math.BigDecimal;

import com.fooddelivery.order.enums.OrderStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
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

    private OrderStatus status;
}