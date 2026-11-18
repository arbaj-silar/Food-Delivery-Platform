
package com.fooddelivery.order.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MenuItemDetails {

    private Long id;
    private Long restaurantId;
    private String name;
    private BigDecimal price;
    private boolean available;
}
