package com.fooddelivery.delivery.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fooddelivery.delivery.entity.DeliveryPartner;
import com.fooddelivery.delivery.enums.AvailabilityStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryPartnerRepository
        extends JpaRepository<DeliveryPartner, Long> {

    Optional<DeliveryPartner> findByKeycloakUserId(String keycloakUserId);

    boolean existsByKeycloakUserId(String keycloakUserId);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    List<DeliveryPartner> findByAvailabilityStatusAndActiveTrue(
            AvailabilityStatus availabilityStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p FROM DeliveryPartner p
        WHERE p.id = :id
    """)
    Optional<DeliveryPartner> findByIdForUpdate(
            @Param("id") Long id);
    
    List<DeliveryPartner> findAllByOrderByCreatedAtDesc();
}