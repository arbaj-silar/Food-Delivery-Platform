package com.fooddelivery.delivery.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddelivery.delivery.dto.DeliveryAssignmentRequest;
import com.fooddelivery.delivery.dto.DeliveryAssignmentResponse;
import com.fooddelivery.delivery.dto.DeliveryDecisionRequest;

import com.fooddelivery.delivery.entity.DeliveryAssignment;
import com.fooddelivery.delivery.entity.DeliveryPartner;

import com.fooddelivery.delivery.client.OrderServiceClient;
import com.fooddelivery.delivery.client.PaymentServiceClient;
import com.fooddelivery.delivery.dto.DeliveryOrderDetailsResponse;
import com.fooddelivery.delivery.dto.DeliveryPartnerStatsResponse;
import com.fooddelivery.delivery.dto.DeliveryLocationRequest;
import com.fooddelivery.delivery.enums.AvailabilityStatus;
import com.fooddelivery.delivery.enums.DeliveryStatus;

import com.fooddelivery.delivery.repository.DeliveryAssignmentRepository;
import com.fooddelivery.delivery.repository.DeliveryPartnerRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.fooddelivery.delivery.dto.DeliveryTrackingResponse;
import org.springframework.web.client.RestClientException;
import com.fooddelivery.delivery.dto.CreateDeliveryEarningRequest;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryAssignmentService {

    private final DeliveryAssignmentRepository assignmentRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final OrderServiceClient orderServiceClient;
    private final NotificationPublisher notificationPublisher;
    private final PaymentServiceClient paymentServiceClient;
    private final DeliveryDistanceCalculator distanceCalculator;
    private final DeliveryEarningCalculator earningCalculator;

    public DeliveryAssignmentResponse assignOrder(
            DeliveryAssignmentRequest request) {

        DeliveryOrderDetailsResponse order =
                orderServiceClient.getOrderDetails(request.getOrderId());

        if (order == null) {
            throw new IllegalArgumentException(
                    "Order not found");
        }

        if (!"READY_FOR_PICKUP".equals(order.getStatus())) {
            throw new IllegalArgumentException(
                    "Only orders with READY_FOR_PICKUP status can be assigned");
        }

        DeliveryPartner partner = partnerRepository
                .findByIdForUpdate(request.getDeliveryPartnerId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery partner not found"));

        if (!Boolean.TRUE.equals(partner.getActive())) {
            throw new IllegalArgumentException(
                    "Delivery partner account is inactive");
        }

        if (partner.getAvailabilityStatus() != AvailabilityStatus.AVAILABLE) {
            throw new IllegalArgumentException(
                    "Delivery partner is not available");
        }

        DeliveryAssignment assignment = assignmentRepository
                .findByOrderId(request.getOrderId())
                .orElse(null);

        if (assignment != null) {

            if (assignment.getStatus() != DeliveryStatus.REJECTED
                    && assignment.getStatus() != DeliveryStatus.CANCELLED) {

                throw new IllegalArgumentException(
                        "This order already has an active delivery assignment");
            }

            assignment.setDeliveryPartner(partner);
            assignment.setStatus(DeliveryStatus.ASSIGNED);
            assignment.setAssignedAt(LocalDateTime.now());
            assignment.setAcceptedAt(null);
            assignment.setPickedUpAt(null);
            assignment.setOutForDeliveryAt(null);
            assignment.setDeliveredAt(null);
            assignment.setRejectionReason(null);
            assignment.setDeliveryNotes(null);

        } else {

            assignment = DeliveryAssignment.builder()
                    .orderId(request.getOrderId())
                    .deliveryPartner(partner)
                    .status(DeliveryStatus.ASSIGNED)
                    .assignedAt(LocalDateTime.now())
                    .build();
        }

        partner.setAvailabilityStatus(AvailabilityStatus.UNAVAILABLE);

        DeliveryAssignment saved = assignmentRepository.save(assignment);

        notificationPublisher.publishDeliveryNotification(
                order.getCustomerId(),
                saved.getOrderId(),
                "ASSIGNED");

        return mapToResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public List<DeliveryOrderDetailsResponse> getReadyForAssignmentOrders() {

        List<DeliveryOrderDetailsResponse> orders =
                orderServiceClient.getReadyForDeliveryOrders();

        List<DeliveryStatus> activeStatuses = List.of(
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.ACCEPTED,
                DeliveryStatus.PICKED_UP,
                DeliveryStatus.OUT_FOR_DELIVERY
        );

        return orders.stream()
                .filter(order -> !assignmentRepository
                        .findByOrderId(order.getId())
                        .map(assignment -> activeStatuses.contains(
                                assignment.getStatus()))
                        .orElse(false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DeliveryAssignmentResponse> getMyAssignments(
            String keycloakUserId) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        return assignmentRepository
                .findByDeliveryPartnerIdOrderByCreatedAtDesc(partner.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
	
	@Transactional(readOnly = true)
	public List<DeliveryAssignmentResponse> getAllAssignments() {
	
	    return assignmentRepository.findAll()
	            .stream()
	            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
	            .map(this::mapToResponse)
	            .toList();
	}

	public DeliveryAssignmentResponse acceptAssignment(
	        Long assignmentId,
	        String keycloakUserId) {
	
	    DeliveryPartner partner = getPartner(keycloakUserId);
	
	    DeliveryAssignment assignment =
	            getAssignment(assignmentId);
	
	    verifyOwnership(assignment, partner);
	
	    if (assignment.getStatus() != DeliveryStatus.ASSIGNED) {
	        throw new IllegalArgumentException(
	                "Only assigned deliveries can be accepted");
	    }
	
	    // Accept delivery assignment
	    assignment.setStatus(DeliveryStatus.ACCEPTED);
	    assignment.setAcceptedAt(LocalDateTime.now());
	
	    // Mark partner as busy
	    partner.setAvailabilityStatus(AvailabilityStatus.ON_DELIVERY);
	
	    DeliveryAssignment saved =
	            assignmentRepository.save(assignment);
	
	    // Notify customer
	    publishNotification(saved.getOrderId(), "ACCEPTED");
	
	    return mapToResponse(saved);
	}


    public DeliveryAssignmentResponse rejectAssignment(
            Long assignmentId,
            String keycloakUserId,
            DeliveryDecisionRequest request) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        DeliveryAssignment assignment =
                getAssignment(assignmentId);

        verifyOwnership(assignment, partner);

        if (assignment.getStatus() != DeliveryStatus.ASSIGNED) {
            throw new IllegalArgumentException(
                    "Only assigned deliveries can be rejected");
        }

        assignment.setStatus(DeliveryStatus.REJECTED);

        if (request != null) {
            assignment.setRejectionReason(request.getRejectionReason());
        }

        partner.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

        return mapToResponse(
                assignmentRepository.save(assignment));
    }

    private DeliveryPartner getPartner(String keycloakUserId) {

        DeliveryPartner partner = partnerRepository
                .findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery partner profile not found"));

        if (!Boolean.TRUE.equals(partner.getActive())) {
            throw new IllegalArgumentException(
                    "Delivery partner account is inactive");
        }

        return partner;
    }

    private DeliveryAssignment getAssignment(Long assignmentId) {

        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Delivery assignment not found"));
    }

    private void verifyOwnership(
            DeliveryAssignment assignment,
            DeliveryPartner partner) {

        if (!assignment.getDeliveryPartner().getId()
                .equals(partner.getId())) {

            throw new AccessDeniedException(
                    "You cannot access another partner's assignment");
        }
    }

    private DeliveryAssignmentResponse mapToResponse(
            DeliveryAssignment assignment) {

        DeliveryPartner partner = assignment.getDeliveryPartner();

        return DeliveryAssignmentResponse.builder()
                .id(assignment.getId())
                .orderId(assignment.getOrderId())
                .deliveryPartnerId(partner.getId())
                .deliveryPartnerName(partner.getFullName())
                .status(assignment.getStatus())
                .assignedAt(assignment.getAssignedAt())
                .acceptedAt(assignment.getAcceptedAt())
                .pickedUpAt(assignment.getPickedUpAt())
                .deliveredAt(assignment.getDeliveredAt())
                .rejectionReason(assignment.getRejectionReason())
                .deliveryNotes(assignment.getDeliveryNotes())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }
    
    public DeliveryAssignmentResponse pickupOrder(
            Long assignmentId,
            String keycloakUserId) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        DeliveryAssignment assignment = getAssignment(assignmentId);

        // Verify assignment ownership
        verifyOwnership(assignment, partner);

        // Validate assignment status
        if (assignment.getStatus() != DeliveryStatus.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Only accepted deliveries can be picked up");
        }

        // Update Order Service first
        orderServiceClient.updateOrderStatus(
                assignment.getOrderId(),
                "PICKED_UP"
        );

        // Update Delivery Service
        assignment.setStatus(DeliveryStatus.PICKED_UP);
        assignment.setPickedUpAt(LocalDateTime.now());

        DeliveryAssignment saved =
                assignmentRepository.save(assignment);

        publishNotification(saved.getOrderId(), "PICKED_UP");

        return mapToResponse(saved);
    }
    
    public DeliveryAssignmentResponse startDelivery(
            Long assignmentId,
            String keycloakUserId) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        DeliveryAssignment assignment = getAssignment(assignmentId);

        verifyOwnership(assignment, partner);

        if (assignment.getStatus() != DeliveryStatus.PICKED_UP) {
            throw new IllegalArgumentException(
                    "Only picked-up deliveries can be started");
        }

        orderServiceClient.updateOrderStatus(
                assignment.getOrderId(), "OUT_FOR_DELIVERY");

        assignment.setStatus(DeliveryStatus.OUT_FOR_DELIVERY);
        assignment.setOutForDeliveryAt(LocalDateTime.now());

        DeliveryAssignment saved =
                assignmentRepository.save(assignment);

        publishNotification(saved.getOrderId(), "OUT_FOR_DELIVERY");

        return mapToResponse(saved);
    }
    

	public DeliveryAssignmentResponse completeDelivery(
	        Long assignmentId,
	        String keycloakUserId) {
	
	    DeliveryPartner partner = getPartner(keycloakUserId);
	
	    DeliveryAssignment assignment = getAssignment(assignmentId);
	
	    verifyOwnership(assignment, partner);
	
	    if (assignment.getStatus() != DeliveryStatus.OUT_FOR_DELIVERY) {
	        throw new IllegalArgumentException(
	                "Only out-for-delivery orders can be completed");
	    }
	
	    // Update Order Service
	    orderServiceClient.updateOrderStatus(
	            assignment.getOrderId(),
	            "DELIVERED"
	    );
	
	    // Complete delivery
	    assignment.setStatus(DeliveryStatus.DELIVERED);
	    assignment.setDeliveredAt(LocalDateTime.now());
	
	    // Check other active deliveries
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
	
	    if (activeDeliveries <= 1) {
	        partner.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
	    }
	
	    // Save completed assignment
	    DeliveryAssignment saved =
	            assignmentRepository.save(assignment);
	
	    // Automatically generate delivery earning
	    generateDeliveryEarning(saved, partner);
	
	    // Publish completion notification
	    publishNotification(saved.getOrderId(), "DELIVERED");
	
	    return mapToResponse(saved);
	}

    
    private void generateDeliveryEarning(
            DeliveryAssignment assignment,
            DeliveryPartner partner) {

        DeliveryOrderDetailsResponse order =
                orderServiceClient.getOrderDetails(
                        assignment.getOrderId());

        if (order == null
                || order.getRestaurantLatitude() == null
                || order.getRestaurantLongitude() == null
                || order.getDeliveryLatitude() == null
                || order.getDeliveryLongitude() == null) {

            log.warn(
                    "Earning skipped for assignment {}: coordinates are missing",
                    assignment.getId());

            return;
        }

        BigDecimal distanceKm = distanceCalculator.calculateDistanceKm(
                order.getRestaurantLatitude(),
                order.getRestaurantLongitude(),
                order.getDeliveryLatitude(),
                order.getDeliveryLongitude()
        );

        BigDecimal earningAmount =
                earningCalculator.calculateEarning(distanceKm);

        CreateDeliveryEarningRequest request =
                new CreateDeliveryEarningRequest();

        request.setDeliveryAssignmentId(assignment.getId());
        request.setOrderId(assignment.getOrderId());
        request.setDeliveryPartnerId(partner.getId());
        request.setAmount(earningAmount);
        request.setCompletedAt(assignment.getDeliveredAt());

        try {
            paymentServiceClient.createDeliveryEarning(request);

            log.info(
                    "Delivery earning created: assignment={}, distance={} km, amount={}",
                    assignment.getId(),
                    distanceKm,
                    earningAmount);

        } catch (RestClientException ex) {
            log.error(
                    "Unable to create earning for assignment {}. Manual recovery may be required.",
                    assignment.getId(),
                    ex);
        }
    }
    
    @Transactional(readOnly = true)
    public List<DeliveryAssignmentResponse> getMyDeliveryHistory(
            String keycloakUserId) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        return assignmentRepository
                .findByDeliveryPartnerIdAndStatusOrderByCreatedAtDesc(
                        partner.getId(),
                        DeliveryStatus.DELIVERED)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
    
    @Transactional(readOnly = true)
    public DeliveryPartnerStatsResponse getMyStatistics(
            String keycloakUserId) {

        DeliveryPartner partner = getPartner(keycloakUserId);

        Long partnerId = partner.getId();

        long total = assignmentRepository
                .countByDeliveryPartnerId(partnerId);

        long assigned = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.ASSIGNED);

        long accepted = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.ACCEPTED);

        long pickedUp = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.PICKED_UP);

        long outForDelivery = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.OUT_FOR_DELIVERY);

        long completed = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.DELIVERED);

        long rejected = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.REJECTED);

        long cancelled = assignmentRepository
                .countByDeliveryPartnerIdAndStatus(
                        partnerId, DeliveryStatus.CANCELLED);

        long active = assigned + accepted + pickedUp + outForDelivery;

        return DeliveryPartnerStatsResponse.builder()
                .totalAssignments(total)
                .assignedDeliveries(assigned)
                .acceptedDeliveries(accepted)
                .pickedUpDeliveries(pickedUp)
                .outForDelivery(outForDelivery)
                .completedDeliveries(completed)
                .rejectedDeliveries(rejected)
                .cancelledDeliveries(cancelled)
                .activeDeliveries(active)
                .build();
    }
    
    private void publishNotification(Long orderId, String status) {

        DeliveryOrderDetailsResponse order =
                orderServiceClient.getOrderDetails(orderId);

        if (order == null
                || order.getCustomerId() == null
                || order.getCustomerId().isBlank()) {

            throw new IllegalStateException(
                    "Unable to find customer for order " + orderId);
        }

        notificationPublisher.publishDeliveryNotification(
                order.getCustomerId(),
                orderId,
                status);
    }
    
    public void updateDeliveryLocation(
            Long assignmentId,
            String keycloakUserId,
            DeliveryLocationRequest request) {

        // Find the delivery partner
        DeliveryPartner partner = getPartner(keycloakUserId);

        // Find the delivery assignment
        DeliveryAssignment assignment = getAssignment(assignmentId);

        // Verify assignment ownership
        verifyOwnership(assignment, partner);

        // Allow GPS updates only during active delivery
        if (assignment.getStatus() != DeliveryStatus.PICKED_UP
                && assignment.getStatus() != DeliveryStatus.OUT_FOR_DELIVERY) {

            throw new IllegalArgumentException(
                    "GPS updates are allowed only after order pickup");
        }

        // Update partner's current GPS location
        partner.setCurrentLatitude(request.getLatitude());
        partner.setCurrentLongitude(request.getLongitude());
        partner.setLocationUpdatedAt(LocalDateTime.now());

        // Save updated location
        partnerRepository.save(partner);
    }
    
    @Transactional(readOnly = true)
    public DeliveryTrackingResponse getOrderTracking(
            Long orderId,
            String customerId) {

        // Verify that the order exists and belongs to this customer
        DeliveryOrderDetailsResponse order =
                orderServiceClient.getOrderDetails(orderId);

        if (order == null) {
            throw new IllegalArgumentException("Order not found");
        }

        if (!customerId.equals(order.getCustomerId())) {
            throw new AccessDeniedException(
                    "You cannot track another customer's order");
        }

        // Find the delivery assignment
        DeliveryAssignment assignment = assignmentRepository
                .findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No delivery assignment found for this order"));

        DeliveryPartner partner = assignment.getDeliveryPartner();

        return DeliveryTrackingResponse.builder()
                .assignmentId(assignment.getId())
                .orderId(assignment.getOrderId())
                .deliveryPartnerName(partner.getFullName())
                .deliveryPartnerPhone(partner.getPhone())
                .status(assignment.getStatus())
                .assignedAt(assignment.getAssignedAt())
                .acceptedAt(assignment.getAcceptedAt())
                .pickedUpAt(assignment.getPickedUpAt())
                .outForDeliveryAt(assignment.getOutForDeliveryAt())
                .deliveredAt(assignment.getDeliveredAt())
                .updatedAt(assignment.getUpdatedAt())
                .latitude(partner.getCurrentLatitude())
                .longitude(partner.getCurrentLongitude())
                .locationUpdatedAt(partner.getLocationUpdatedAt())
                .build();
    }
}