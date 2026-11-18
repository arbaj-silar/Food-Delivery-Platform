package com.fooddelivery.delivery.service;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddelivery.delivery.dto.AvailabilityRequest;
import com.fooddelivery.delivery.dto.DeliveryPartnerRequest;
import com.fooddelivery.delivery.dto.DeliveryPartnerResponse;

import com.fooddelivery.delivery.entity.DeliveryPartner;

import com.fooddelivery.delivery.enums.AvailabilityStatus;
import com.fooddelivery.delivery.enums.DeliveryStatus;
import com.fooddelivery.delivery.repository.DeliveryAssignmentRepository;
import com.fooddelivery.delivery.repository.DeliveryPartnerRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryPartnerService {

    private final DeliveryPartnerRepository deliveryPartnerRepository;
    
    private final DeliveryAssignmentRepository assignmentRepository;
    
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public List<DeliveryPartnerResponse> getAvailablePartners() {

        return deliveryPartnerRepository
                .findByAvailabilityStatusAndActiveTrue(
                        AvailabilityStatus.AVAILABLE)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
    
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional(readOnly = true)
    public List<DeliveryPartnerResponse> getAllPartners() {

        return deliveryPartnerRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
    
 // ADMIN: Activate or deactivate delivery partner
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public DeliveryPartnerResponse updatePartnerActiveStatus(
            Long partnerId,
            boolean active) {

        DeliveryPartner partner = deliveryPartnerRepository
                .findById(partnerId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery partner not found"));

        if (!active) {
        	
        	if (partner.getAvailabilityStatus() == AvailabilityStatus.ON_DELIVERY) {
        	    throw new IllegalArgumentException(
        	            "Cannot deactivate a partner who is currently delivering an order"
        	    );
        	}

            List<DeliveryStatus> activeStatuses = List.of(
                    DeliveryStatus.ASSIGNED,
                    DeliveryStatus.ACCEPTED,
                    DeliveryStatus.PICKED_UP,
                    DeliveryStatus.OUT_FOR_DELIVERY
            );

            boolean hasActiveDeliveries = assignmentRepository
                    .existsByDeliveryPartnerIdAndStatusIn(
                            partnerId,
                            activeStatuses
                    );

            if (hasActiveDeliveries) {
                throw new IllegalArgumentException(
                        "Cannot deactivate a partner with active deliveries");
            }

            partner.setAvailabilityStatus(AvailabilityStatus.UNAVAILABLE);
        }

        partner.setActive(active);

        return mapToResponse(
                deliveryPartnerRepository.save(partner));
    }
    
    public DeliveryPartnerResponse registerPartner(
            String keycloakUserId,
            DeliveryPartnerRequest request) {

        if (deliveryPartnerRepository.existsByKeycloakUserId(keycloakUserId)) {
            throw new IllegalArgumentException(
                    "Delivery partner profile already exists");
        }

        if (deliveryPartnerRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException(
                    "Phone number is already registered");
        }

        DeliveryPartner partner = DeliveryPartner.builder()
                .keycloakUserId(keycloakUserId)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .vehicleType(request.getVehicleType())
                .availabilityStatus(AvailabilityStatus.UNAVAILABLE)
                .active(true)
                .build();

        DeliveryPartner saved =
                deliveryPartnerRepository.save(partner);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DeliveryPartnerResponse getMyProfile(String keycloakUserId) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        return mapToResponse(partner);
    }

    public DeliveryPartnerResponse updateMyProfile(
            String keycloakUserId,
            DeliveryPartnerRequest request) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        if (deliveryPartnerRepository.existsByPhoneAndIdNot(
                request.getPhone(), partner.getId())) {

            throw new IllegalArgumentException(
                    "Phone number is already registered");
        }

        partner.setFullName(request.getFullName());
        partner.setPhone(request.getPhone());
        partner.setVehicleType(request.getVehicleType());

        return mapToResponse(deliveryPartnerRepository.save(partner));
    }

    public DeliveryPartnerResponse updateAvailability(
            String keycloakUserId,
            AvailabilityRequest request) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        AvailabilityStatus newStatus = request.getAvailabilityStatus();

        if (newStatus == null) {
            throw new IllegalArgumentException(
                    "Availability status is required");
        }

        if (newStatus == AvailabilityStatus.ON_DELIVERY) {
            throw new IllegalArgumentException(
                    "ON_DELIVERY status is managed by the delivery system");
        }

        if (newStatus == AvailabilityStatus.AVAILABLE) {

            List<DeliveryStatus> activeStatuses = List.of(
                    DeliveryStatus.ASSIGNED,
                    DeliveryStatus.ACCEPTED,
                    DeliveryStatus.PICKED_UP,
                    DeliveryStatus.OUT_FOR_DELIVERY
            );

            long activeDeliveries = assignmentRepository
                    .countByDeliveryPartnerIdAndStatusIn(
                            partner.getId(),
                            activeStatuses
                    );

            if (activeDeliveries > 0) {
                throw new IllegalArgumentException(
                        "You cannot become AVAILABLE while you have active deliveries");
            }
        }

        partner.setAvailabilityStatus(newStatus);

        return mapToResponse(
                deliveryPartnerRepository.save(partner));
    }

    private DeliveryPartner getPartner(String keycloakUserId) {

        DeliveryPartner partner = deliveryPartnerRepository
                .findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery partner profile not found"));

        if (!Boolean.TRUE.equals(partner.getActive())) {
            throw new IllegalArgumentException(
                    "Delivery partner account is inactive");
        }

        return partner;
    }

    private DeliveryPartnerResponse mapToResponse(
            DeliveryPartner partner) {

        return DeliveryPartnerResponse.builder()
                .id(partner.getId())
                .keycloakUserId(partner.getKeycloakUserId())
                .fullName(partner.getFullName())
                .phone(partner.getPhone())
                .vehicleType(partner.getVehicleType())
                .availabilityStatus(partner.getAvailabilityStatus())
                .active(partner.getActive())
                .createdAt(partner.getCreatedAt())
                .updatedAt(partner.getUpdatedAt())
                .build();
    }
}