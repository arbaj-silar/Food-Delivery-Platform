package com.fooddelivery.order.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantAnalyticsResponse {

    private Long restaurantId;

    private Long totalOrders;

    private Long completedOrders;

    private Long cancelledOrders;

    private BigDecimal totalRevenue;
}