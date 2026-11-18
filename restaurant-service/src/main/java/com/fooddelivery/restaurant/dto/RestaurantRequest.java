
package com.fooddelivery.restaurant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

@Getter
@Setter
public class RestaurantRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 1000)
    private String description;

    @NotBlank
    @Size(max = 255)
    private String address;
    
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private BigDecimal longitude;

    @NotBlank
    @Size(max = 100)
    private String city;

    @NotBlank
    @Pattern(regexp = "^[0-9+()\\- ]{7,20}$",
             message = "Enter a valid phone number")
    private String phone;

    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    @NotBlank
    @Size(max = 100)
    private String cuisineType;

    @Size(max = 500)
    private String imageUrl;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
             message = "Use 24-hour HH:mm format")
    private String openingTime;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
             message = "Use 24-hour HH:mm format")
    private String closingTime;

    private boolean deliveryAvailable;
}
