package com.fooddelivery.delivery.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fooddelivery.delivery.dto.NotificationEvent;

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

    public void publishDeliveryNotification(
            String customerId,
            Long orderId,
            String status) {

        String title;
        String message;
        String type;

        switch (status) {

            case "ASSIGNED" -> {
                title = "Delivery Partner Assigned";
                message = "A delivery partner has been assigned to order #" + orderId + ".";
                type = "DELIVERY_ASSIGNED";
            }

            case "ACCEPTED" -> {
                title = "Delivery Accepted";
                message = "Your delivery for order #" + orderId + " has been accepted.";
                type = "DELIVERY_ACCEPTED";
            }

            case "PICKED_UP" -> {
                title = "Order Picked Up";
                message = "Your order #" + orderId + " has been picked up.";
                type = "ORDER_PICKED_UP";
            }

            case "OUT_FOR_DELIVERY" -> {
                title = "Order Out for Delivery";
                message = "Your order #" + orderId + " is out for delivery.";
                type = "ORDER_OUT_FOR_DELIVERY";
            }

            case "DELIVERED" -> {
                title = "Order Delivered";
                message = "Your order #" + orderId + " has been delivered.";
                type = "DELIVERY_COMPLETED";
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