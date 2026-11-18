package com.fooddelivery.order.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RestaurantDetails {

    private Long id;

    private String name;

    private String status;

    private BigDecimal latitude;

    private BigDecimal longitude;
}