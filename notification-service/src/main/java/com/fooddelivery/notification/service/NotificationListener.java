
package com.fooddelivery.notification.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.fooddelivery.notification.config.RabbitMQConfig;
import com.fooddelivery.notification.dto.NotificationEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void receiveNotification(NotificationEvent event) {

        log.info("Received notification event for user: {}",
                event.getUserId());

        notificationService.saveNotification(event);

        log.info("Notification successfully saved for user: {}",
                event.getUserId());
    }
}
