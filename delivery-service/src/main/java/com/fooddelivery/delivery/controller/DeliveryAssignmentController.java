
package com.fooddelivery.delivery.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.fooddelivery.delivery.dto.DeliveryAssignmentRequest;
import com.fooddelivery.delivery.dto.DeliveryAssignmentResponse;
import com.fooddelivery.delivery.dto.DeliveryDecisionRequest;
import com.fooddelivery.delivery.dto.DeliveryPartnerStatsResponse;
import com.fooddelivery.delivery.dto.DeliveryTrackingResponse;
import com.fooddelivery.delivery.dto.DeliveryLocationRequest;
import com.fooddelivery.delivery.dto.DeliveryOrderDetailsResponse;
import com.fooddelivery.delivery.service.DeliveryAssignmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryAssignmentController {

    private final DeliveryAssignmentService assignmentService;

    // ADMIN: Assign order to delivery partner
    @PostMapping("/assign")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<DeliveryAssignmentResponse> assignOrder(
            @Valid @RequestBody DeliveryAssignmentRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.assignOrder(request));
    }
    
 // ADMIN: Get orders eligible for delivery assignment
    @GetMapping("/admin/ready-orders")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<DeliveryOrderDetailsResponse>>
            getReadyForAssignmentOrders() {

        return ResponseEntity.ok(
                assignmentService.getReadyForAssignmentOrders());
    }
    
 // ADMIN: View all delivery assignments
    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<DeliveryAssignmentResponse>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    // DELIVERY PARTNER: View my assignments
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<List<DeliveryAssignmentResponse>> getMyAssignments(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.getMyAssignments(jwt.getSubject()));
    }

    // DELIVERY PARTNER: Accept assignment
    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryAssignmentResponse> acceptAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.acceptAssignment(
                        id, jwt.getSubject()));
    }

    // DELIVERY PARTNER: Reject assignment
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryAssignmentResponse> rejectAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) DeliveryDecisionRequest request) {

        return ResponseEntity.ok(
                assignmentService.rejectAssignment(
                        id, jwt.getSubject(), request));
    }

    // DELIVERY PARTNER: Pickup order
    @PatchMapping("/{id}/pickup")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryAssignmentResponse> pickupOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.pickupOrder(
                        id, jwt.getSubject()));
    }

    // DELIVERY PARTNER: Start delivery
    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryAssignmentResponse> startDelivery(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.startDelivery(
                        id, jwt.getSubject()));
    }

    // DELIVERY PARTNER: Complete delivery
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryAssignmentResponse> completeDelivery(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.completeDelivery(
                        id, jwt.getSubject()));
    }

    // DELIVERY PARTNER: Delivery history
    @GetMapping("/my/history")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<List<DeliveryAssignmentResponse>> getMyDeliveryHistory(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.getMyDeliveryHistory(
                        jwt.getSubject()));
    }

    // DELIVERY PARTNER: Delivery statistics
    @GetMapping("/my/statistics")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<DeliveryPartnerStatsResponse> getMyStatistics(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.getMyStatistics(
                        jwt.getSubject()));
    }
    
    // DELIVERY PARTNER: Update live GPS location
    @PatchMapping("/{id}/location")
    @PreAuthorize("hasAuthority('ROLE_DELIVERY_PARTNER')")
    public ResponseEntity<String> updateDeliveryLocation(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryLocationRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        assignmentService.updateDeliveryLocation(
                id,
                jwt.getSubject(),
                request);

        return ResponseEntity.ok(
                "Delivery location updated successfully");
    }
    
 // CUSTOMER: Track an order
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAuthority('ROLE_CUSTOMER')")
    public ResponseEntity<DeliveryTrackingResponse> trackOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                assignmentService.getOrderTracking(
                        orderId,
                        jwt.getSubject()));
    }
}
