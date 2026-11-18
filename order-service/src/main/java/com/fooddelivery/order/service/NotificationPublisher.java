package com.fooddelivery.order.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fooddelivery.order.dto.NotificationEvent;

@Component
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.notification-exchange}")
    private String exchange;

    @Value("${app.rabbitmq.notification-routing-key}")
    private String routingKey;

    public NotificationPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishOrderPlaced(String customerId, Long orderId) {

        NotificationEvent event = NotificationEvent.builder()
                .userId(customerId)
                .title("Order Placed Successfully")
                .message("Your order #" + orderId
                        + " has been placed successfully.")
                .type("ORDER_PLACED")
                .referenceId(orderId)
                .build();

        rabbitTemplate.convertAndSend(
                exchange,
                routingKey,
                event
        );
    }
    
    public void publishOrderStatusUpdated(
            String customerId,
            Long orderId,
            String status) {

        String title;
        String message;
        String type;

        switch (status) {
            case "CONFIRMED" -> {
                title = "Order Confirmed";
                message = "Your order #" + orderId + " has been confirmed.";
                type = "ORDER_CONFIRMED";
            }
            case "PREPARING" -> {
                title = "Order Being Prepared";
                message = "Your order #" + orderId + " is being prepared.";
                type = "ORDER_PREPARING";
            }
            case "READY_FOR_PICKUP" -> {
                title = "Order Ready";
                message = "Your order #" + orderId + " is ready for pickup.";
                type = "ORDER_READY";
            }
            case "CANCELLED" -> {
                title = "Order Cancelled";
                message = "Your order #" + orderId + " has been cancelled.";
                type = "ORDER_CANCELLED";
            }
            default -> {
                return;
            }
        }

        NotificationEvent event = NotificationEvent.builder()
                .userId(customerId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(orderId)
                .build();

        rabbitTemplate.convertAndSend(exchange, routingKey, event);
    }
}