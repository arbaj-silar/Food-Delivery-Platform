
package com.fooddelivery.order.dto;

import com.fooddelivery.order.enums.OrderStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OrderStatusRequest {

    @NotNull(message = "Order status is required")
    private OrderStatus status;
}
