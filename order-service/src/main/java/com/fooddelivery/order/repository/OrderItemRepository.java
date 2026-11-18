
package com.fooddelivery.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fooddelivery.order.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

}
