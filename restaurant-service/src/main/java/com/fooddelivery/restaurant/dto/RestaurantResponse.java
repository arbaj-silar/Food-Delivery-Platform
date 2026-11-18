
package com.fooddelivery.restaurant.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RestaurantResponse {

    private Long id;
    private String name;
    private String description;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String city;
    private String phone;
    private String email;
    private String cuisineType;
    private String imageUrl;
    private String openingTime;
    private String closingTime;
    private boolean deliveryAvailable;
    private boolean active;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
