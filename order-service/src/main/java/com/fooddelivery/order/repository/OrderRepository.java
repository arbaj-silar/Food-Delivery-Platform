package com.fooddelivery.order.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fooddelivery.order.entity.Order;
import com.fooddelivery.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fooddelivery.order.enums.PaymentStatus;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByRestaurantIdAndStatusOrderByCreatedAtDesc(
            Long restaurantId,
            OrderStatus status);

    // ADMIN: Get orders ready for delivery assignment
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    
 // ADMIN: Get performance analytics for all restaurants
    @Query("""
        SELECT
            o.restaurantId AS restaurantId,
            COUNT(o) AS totalOrders,
            SUM(CASE WHEN o.status = :delivered THEN 1 ELSE 0 END) AS completedOrders,
            SUM(CASE WHEN o.status = :cancelled THEN 1 ELSE 0 END) AS cancelledOrders,
            COALESCE(
                SUM(
                    CASE
                        WHEN o.status = :delivered
                        AND o.paymentStatus = :paid
                        THEN o.totalAmount
                        ELSE 0
                    END
                ), 0
            ) AS totalRevenue
        FROM Order o
        GROUP BY o.restaurantId
        ORDER BY o.restaurantId
        """)
    List<RestaurantAnalyticsProjection> getRestaurantAnalytics(
            @Param("delivered") OrderStatus delivered,
            @Param("cancelled") OrderStatus cancelled,
            @Param("paid") PaymentStatus paid
    );
}