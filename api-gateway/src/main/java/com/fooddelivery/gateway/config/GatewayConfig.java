
package com.fooddelivery.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {

        return builder.routes()

            .route("user-service", r -> r
                .path("/api/users/**")
                .uri("lb://user-service"))

            .route("restaurant-service", r -> r
                .path("/api/restaurants/**")
                .uri("lb://restaurant-service"))

            .route("menu-service", r -> r
                .path("/api/menu-items/**")
                .uri("lb://menu-service"))
            
            .route("order-service", r -> r
                .path("/api/orders/**")
                .uri("lb://order-service"))
            
            .route("delivery-service", r -> r
            	    .path("/api/deliveries/**")
            	    .uri("lb://delivery-service"))

            	.route("delivery-partner-service", r -> r
            	    .path("/api/delivery-partners/**")
            	    .uri("lb://delivery-service"))

            	.route("notification-service", r -> r
            	    .path("/api/notifications/**")
            	    .uri("lb://notification-service"))
            	
            	.route("payment-service", r -> r
            		    .path("/api/payments/**", "/api/delivery-earnings/**")
            		    .uri("lb://payment-service"))
            	
            .build();
    }
}
