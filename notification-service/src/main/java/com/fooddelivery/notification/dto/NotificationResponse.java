
package com.fooddelivery.notification.dto;

import java.time.LocalDateTime;

import com.fooddelivery.notification.enums.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;

    private String userId;

    private String title;

    private String message;

    private NotificationType type;

    private Long referenceId;

    private boolean read;

    private LocalDateTime createdAt;
}
