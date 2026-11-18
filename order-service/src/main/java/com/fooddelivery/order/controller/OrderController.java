
package com.fooddelivery.order.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import com.fooddelivery.order.dto.DeliveryOrderDetailsResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.fooddelivery.order.dto.CreateOrderRequest;
import com.fooddelivery.order.dto.OrderResponse;
import com.fooddelivery.order.dto.OrderStatusRequest;
import com.fooddelivery.order.dto.PaymentStatusUpdateRequest;
import com.fooddelivery.order.dto.RestaurantAnalyticsResponse;
import com.fooddelivery.order.service.OrderService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    
    @Value("${app.internal-service-key}")
    private String internalServiceKey;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        OrderResponse response =
                orderService.createOrder(request, jwt);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/my")
    public List<OrderResponse> getMyOrders(
            @AuthenticationPrincipal Jwt jwt) {

        return orderService.getMyOrders(jwt);
    }
    

	@GetMapping("/restaurant/{restaurantId}")
	public List<OrderResponse> getRestaurantOrders(
	        @PathVariable Long restaurantId,
	        @AuthenticationPrincipal Jwt jwt) {
	
	    return orderService.getRestaurantOrders(restaurantId, jwt);
	}
	
	@PatchMapping("/{id}/status")
	public OrderResponse updateOrderStatus(
	        @PathVariable Long id,
	        @Valid @RequestBody OrderStatusRequest request,
	        @AuthenticationPrincipal Jwt jwt) {
	
	    return orderService.updateRestaurantOrderStatus(
	            id, request.getStatus(), jwt);
	}

    @GetMapping("/{id}")
    public OrderResponse getMyOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return orderService.getMyOrder(id, jwt);
    }

    @GetMapping("/internal/{id}/delivery-details")
    public DeliveryOrderDetailsResponse getDeliveryOrderDetails(
            @PathVariable Long id,
            @RequestHeader("X-Internal-Service-Key") String serviceKey) {

        verifyInternalServiceKey(serviceKey);

        return orderService.getDeliveryOrderDetails(id);
    }

    @PatchMapping("/internal/{id}/delivery-status")
    public OrderResponse updateDeliveryOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request,
            @RequestHeader("X-Internal-Service-Key") String serviceKey) {

        verifyInternalServiceKey(serviceKey);

        return orderService.updateDeliveryOrderStatus(
                id, request.getStatus());
    }

    private void verifyInternalServiceKey(String providedKey) {

        if (providedKey == null
                || !MessageDigest.isEqual(
                        internalServiceKey.getBytes(StandardCharsets.UTF_8),
                        providedKey.getBytes(StandardCharsets.UTF_8))) {

            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Invalid internal service credentials");
        }
    }
    
 // ADMIN: Get orders ready for delivery assignment
    @GetMapping("/admin/ready-for-delivery")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<OrderResponse>> getReadyForDeliveryOrders() {

        return ResponseEntity.ok(
                orderService.getReadyForDeliveryOrders());
    }
    
 // INTERNAL: Get orders ready for delivery assignment
    @GetMapping("/internal/ready-for-delivery")
    public ResponseEntity<List<OrderResponse>> getInternalReadyForDeliveryOrders(
            @RequestHeader("X-Internal-Service-Key") String serviceKey) {

        verifyInternalServiceKey(serviceKey);

        return ResponseEntity.ok(
                orderService.getReadyForDeliveryOrders());
    }
    
 // ADMIN: Get restaurant-wise performance analytics
    @GetMapping("/admin/restaurant-analytics")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<RestaurantAnalyticsResponse>>
            getRestaurantAnalytics() {

        return ResponseEntity.ok(
                orderService.getRestaurantAnalytics()
        );
    }
 // INTERNAL: Update order payment status
    @PatchMapping("/internal/{orderId}/payment-status")
    public ResponseEntity<Void> updatePaymentStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody PaymentStatusUpdateRequest request,
            @RequestHeader("X-Internal-Service-Key") String serviceKey) {

        verifyInternalServiceKey(serviceKey);

        orderService.updatePaymentStatus(
                orderId,
                request.getPaymentStatus()
        );

        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/internal/{id}/payment-details")
    public ResponseEntity<OrderResponse> getPaymentOrderDetails(
            @PathVariable Long id,
            @RequestHeader("X-Internal-Service-Key") String serviceKey) {

        verifyInternalServiceKey(serviceKey);

        return ResponseEntity.ok(
                orderService.getPaymentOrderDetails(id)
        );
    }
}
