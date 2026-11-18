
package com.fooddelivery.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleApplicationRequest {

    @NotBlank(message = "Requested role is required")
    @Pattern(
        regexp = "^(RESTAURANT_OWNER|DELIVERY_PARTNER)$",
        message = "Only RESTAURANT_OWNER or DELIVERY_PARTNER applications are allowed"
    )
    private String requestedRole;
}
