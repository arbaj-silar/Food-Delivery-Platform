package com.fooddelivery.notification.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.fooddelivery.notification.dto.NotificationResponse;
import com.fooddelivery.notification.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                notificationService.getMyNotifications(jwt.getSubject()));
    }

    @GetMapping("/me/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                notificationService.getUnreadNotifications(jwt.getSubject()));
    }

    @GetMapping("/me/unread/count")
    public ResponseEntity<Long> getUnreadCount(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                notificationService.getUnreadCount(jwt.getSubject()));
    }

    @GetMapping("/me/read")
    public ResponseEntity<List<NotificationResponse>> getReadNotifications(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                notificationService.getReadNotifications(jwt.getSubject()));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                notificationService.markAsRead(
                        notificationId, jwt.getSubject()));
    }
    
 // ADMIN: Get all notifications across users
    @GetMapping("/admin/all")
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {

        return ResponseEntity.ok(
                notificationService.getAllNotifications()
        );
    }
}