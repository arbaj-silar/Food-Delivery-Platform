
package com.fooddelivery.notification.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fooddelivery.notification.entity.Notification;

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(
            String userId);

    long countByUserIdAndReadFalse(String userId);

    List<Notification> findByUserIdAndReadTrueOrderByCreatedAtDesc(
            String userId);
}
