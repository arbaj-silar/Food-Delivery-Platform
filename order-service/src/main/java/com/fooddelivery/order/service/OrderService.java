
package com.fooddelivery.order.service;

import java.math.BigDecimal;
import com.fooddelivery.order.dto.RestaurantAnalyticsResponse;
import com.fooddelivery.order.dto.DeliveryOrderDetailsResponse;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.order.dto.CreateOrderRequest;
import com.fooddelivery.order.dto.MenuItemDetails;
import com.fooddelivery.order.dto.OrderItemResponse;
import com.fooddelivery.order.dto.OrderResponse;
import com.fooddelivery.order.dto.RestaurantDetails;
import com.fooddelivery.order.entity.Order;
import com.fooddelivery.order.entity.OrderItem;
import com.fooddelivery.order.enums.OrderStatus;
import com.fooddelivery.order.enums.PaymentStatus;
import com.fooddelivery.order.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuServiceClient menuServiceClient;
    private final RestaurantServiceClient restaurantServiceClient;
    private final NotificationPublisher notificationPublisher;

    @Transactional
    public OrderResponse createOrder(
            CreateOrderRequest request, Jwt jwt) {

        String customerId = jwt.getSubject();

        Order order = Order.builder()
                .customerId(customerId)
                .restaurantId(request.getRestaurantId())
                .deliveryAddress(request.getDeliveryAddress().trim())
                .deliveryLatitude(BigDecimal.valueOf(request.getDeliveryLatitude()))
                .deliveryLongitude(BigDecimal.valueOf(request.getDeliveryLongitude()))
                .specialInstructions(request.getSpecialInstructions())
                .status(OrderStatus.PLACED)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CreateOrderRequest.OrderItemRequest requestedItem
                : request.getItems()) {

            MenuItemDetails menuItem =
                    menuServiceClient.getMenuItem(
                            requestedItem.getMenuItemId());

            if (!request.getRestaurantId().equals(
                    menuItem.getRestaurantId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Menu item does not belong to the selected restaurant");
            }

            BigDecimal unitPrice = menuItem.getPrice();

            if (unitPrice == null || unitPrice.signum() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Invalid menu item price received");
            }

            BigDecimal subtotal = unitPrice.multiply(
                    BigDecimal.valueOf(requestedItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItemId(menuItem.getId())
                    .itemName(menuItem.getName())
                    .quantity(requestedItem.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();

            order.getItems().add(orderItem);
            total = total.add(subtotal);
        }

        order.setTotalAmount(total);

        Order savedOrder = orderRepository.save(order);

	     // Publish notification event
	     notificationPublisher.publishOrderPlaced(
	             savedOrder.getCustomerId(),
	             savedOrder.getId()
	     );
	
	     return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(Jwt jwt) {

        String customerId = jwt.getSubject();

        return orderRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(Long orderId, Jwt jwt) {

        String customerId = jwt.getSubject();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found"));

        if (!order.getCustomerId().equals(customerId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access another customer's order");
        }

        return toResponse(order);
    }

    private OrderResponse toResponse(Order order) {

        List<OrderItemResponse> items = order.getItems()
                .stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItemId())
                        .itemName(item.getItemName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomerId())
                .restaurantId(order.getRestaurantId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryLatitude(order.getDeliveryLatitude())
                .deliveryLongitude(order.getDeliveryLongitude())
                .specialInstructions(order.getSpecialInstructions())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(items)
                .build();
    }
	
	@Transactional(readOnly = true)
	public List<OrderResponse> getRestaurantOrders(
	        Long restaurantId, Jwt jwt) {
	
	    verifyRestaurantOwner(restaurantId, jwt);
	
	    return orderRepository
	            .findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
	            .stream()
	            .map(this::toResponse)
	            .toList();
	}
	
	@Transactional
	public OrderResponse updateRestaurantOrderStatus(
	        Long orderId, OrderStatus newStatus, Jwt jwt) {
	
	    Order order = orderRepository.findById(orderId)
	            .orElseThrow(() -> new ResponseStatusException(
	                    HttpStatus.NOT_FOUND, "Order not found"));
	
	    verifyRestaurantOwner(order.getRestaurantId(), jwt);
	
	    if (newStatus != OrderStatus.CONFIRMED
	            && newStatus != OrderStatus.CANCELLED
	            && newStatus != OrderStatus.PREPARING
	            && newStatus != OrderStatus.READY_FOR_PICKUP) {
	
	        throw new ResponseStatusException(
	                HttpStatus.BAD_REQUEST,
	                "Invalid restaurant order status");
	    }
	
	    OrderStatus current = order.getStatus();
	
	    boolean validTransition =
	            (current == OrderStatus.PLACED
	                    && (newStatus == OrderStatus.CONFIRMED
	                    || newStatus == OrderStatus.CANCELLED))
	            || (current == OrderStatus.CONFIRMED
	                    && (newStatus == OrderStatus.PREPARING
	                    || newStatus == OrderStatus.CANCELLED))
	            || (current == OrderStatus.PREPARING
	                    && newStatus == OrderStatus.READY_FOR_PICKUP);
	
	    if (!validTransition) {
	        throw new ResponseStatusException(
	                HttpStatus.CONFLICT,
	                "Invalid order status transition");
	    }
	
	    order.setStatus(newStatus);

	    Order savedOrder = orderRepository.save(order);

	    // Send notification to customer
	    notificationPublisher.publishOrderStatusUpdated(
	            savedOrder.getCustomerId(),
	            savedOrder.getId(),
	            savedOrder.getStatus().name()
	    );

	    return toResponse(savedOrder);
	}
	
	private void verifyRestaurantOwner(Long restaurantId, Jwt jwt) {
	
	    if (jwt == null) {
	        throw new ResponseStatusException(
	                HttpStatus.UNAUTHORIZED, "Authentication required");
	    }
	
	    boolean isOwner = restaurantServiceClient.ownsRestaurant(
	            restaurantId, jwt.getTokenValue());
	
	    if (!isOwner) {
	        throw new ResponseStatusException(
	                HttpStatus.FORBIDDEN,
	                "You do not own this restaurant");
	    }
	}
	
	@Transactional(readOnly = true)
	public DeliveryOrderDetailsResponse getDeliveryOrderDetails(Long orderId) {

	    Order order = orderRepository.findById(orderId)
	            .orElseThrow(() -> new ResponseStatusException(
	                    HttpStatus.NOT_FOUND,
	                    "Order not found"));
	    
	    RestaurantDetails restaurant =
	            restaurantServiceClient.getRestaurantDetails(
	                    order.getRestaurantId()
	            );
	    
	    return DeliveryOrderDetailsResponse.builder()
	            .id(order.getId())
	            .customerId(order.getCustomerId())
	            .restaurantId(order.getRestaurantId())
	            .deliveryAddress(order.getDeliveryAddress())
	            .deliveryLatitude(order.getDeliveryLatitude())
	            .deliveryLongitude(order.getDeliveryLongitude())
	            .restaurantLatitude(restaurant.getLatitude())
	            .restaurantLongitude(restaurant.getLongitude())
	            .totalAmount(order.getTotalAmount())
	            .status(order.getStatus())
	            .build();
	}

	@Transactional
	public OrderResponse updateDeliveryOrderStatus(
	        Long orderId, OrderStatus newStatus) {

	    Order order = orderRepository.findById(orderId)
	            .orElseThrow(() -> new ResponseStatusException(
	                    HttpStatus.NOT_FOUND,
	                    "Order not found"));

	    OrderStatus currentStatus = order.getStatus();

	    boolean validTransition =
	            (currentStatus == OrderStatus.READY_FOR_PICKUP
	                    && newStatus == OrderStatus.PICKED_UP)
	            || (currentStatus == OrderStatus.PICKED_UP
	                    && newStatus == OrderStatus.OUT_FOR_DELIVERY)
	            || (currentStatus == OrderStatus.OUT_FOR_DELIVERY
	                    && newStatus == OrderStatus.DELIVERED);

	    if (!validTransition) {
	        throw new ResponseStatusException(
	                HttpStatus.CONFLICT,
	                "Invalid delivery order status transition");
	    }

	    order.setStatus(newStatus);

	    Order savedOrder = orderRepository.save(order);

	    return toResponse(savedOrder);
	}
	
	// ADMIN: Get orders ready for delivery assignment
	@Transactional(readOnly = true)
	public List<OrderResponse> getReadyForDeliveryOrders() {

	    return orderRepository
	            .findByStatusOrderByCreatedAtDesc(
	                    OrderStatus.READY_FOR_PICKUP)
	            .stream()
	            .map(this::toResponse)
	            .toList();
	}
	
	// ADMIN: Get restaurant-wise performance analytics
	@Transactional(readOnly = true)
	public List<RestaurantAnalyticsResponse> getRestaurantAnalytics() {

	    return orderRepository.getRestaurantAnalytics(
	            OrderStatus.DELIVERED,
	            OrderStatus.CANCELLED,
	            PaymentStatus.PAID
	    )
	    .stream()
	    .map(analytics -> RestaurantAnalyticsResponse.builder()
	            .restaurantId(analytics.getRestaurantId())
	            .totalOrders(analytics.getTotalOrders())
	            .completedOrders(analytics.getCompletedOrders())
	            .cancelledOrders(analytics.getCancelledOrders())
	            .totalRevenue(analytics.getTotalRevenue())
	            .build())
	    .toList();
	}
	
	// INTERNAL: Update order payment status
	@Transactional
	public void updatePaymentStatus(
	        Long orderId,
	        PaymentStatus paymentStatus) {

	    Order order = orderRepository.findById(orderId)
	            .orElseThrow(() -> new IllegalArgumentException(
	                    "Order not found: " + orderId));

	    PaymentStatus currentStatus = order.getPaymentStatus();

	    boolean validTransition =
	            currentStatus == PaymentStatus.PENDING
	                    && (paymentStatus == PaymentStatus.PAID
	                    || paymentStatus == PaymentStatus.FAILED)
	            || currentStatus == PaymentStatus.PAID
	                    && paymentStatus == PaymentStatus.REFUNDED;

	    if (!validTransition) {
	        throw new IllegalStateException(
	                "Invalid payment status transition: "
	                        + currentStatus + " -> " + paymentStatus
	        );
	    }

	    order.setPaymentStatus(paymentStatus);
	    orderRepository.save(order);
	}
	
	// INTERNAL: Get order details for Payment Service
	@Transactional(readOnly = true)
	public OrderResponse getPaymentOrderDetails(Long orderId) {

	    Order order = orderRepository.findById(orderId)
	            .orElseThrow(() -> new ResponseStatusException(
	                    HttpStatus.NOT_FOUND,
	                    "Order not found"));

	    return toResponse(order);
	}
}
