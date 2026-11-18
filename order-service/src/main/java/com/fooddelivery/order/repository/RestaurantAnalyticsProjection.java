package com.fooddelivery.order.repository;

import java.math.BigDecimal;

public interface RestaurantAnalyticsProjection {

    Long getRestaurantId();

    Long getTotalOrders();

    Long getCompletedOrders();

    Long getCancelledOrders();

    BigDecimal getTotalRevenue();
}