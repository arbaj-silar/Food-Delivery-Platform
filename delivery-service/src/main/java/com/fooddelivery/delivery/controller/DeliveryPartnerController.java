
package com.fooddelivery.delivery.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.fooddelivery.delivery.dto.AvailabilityRequest;
import com.fooddelivery.delivery.dto.DeliveryPartnerRequest;
import com.fooddelivery.delivery.dto.DeliveryPartnerResponse;
import com.fooddelivery.delivery.service.DeliveryPartnerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/delivery-partners")
@RequiredArgsConstructor
public class DeliveryPartnerController {

    private final DeliveryPartnerService deliveryPartnerService;

    // Register delivery partner
    @PostMapping("/me")
    public ResponseEntity<DeliveryPartnerResponse> registerPartner(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeliveryPartnerRequest request) {

        DeliveryPartnerResponse response =
                deliveryPartnerService.registerPartner(
                        jwt.getSubject(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }

    // Get my profile
    @GetMapping("/me")
    public ResponseEntity<DeliveryPartnerResponse> getMyProfile(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                deliveryPartnerService.getMyProfile(
                        jwt.getSubject()));
    }
    
 // ADMIN: Get all registered delivery partners
    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<DeliveryPartnerResponse>> getAllPartners() {

        return ResponseEntity.ok(
                deliveryPartnerService.getAllPartners());
    }
    
 // ADMIN: Activate or deactivate delivery partner
    @PatchMapping("/admin/{partnerId}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<DeliveryPartnerResponse> updatePartnerActiveStatus(
            @PathVariable Long partnerId,
            @RequestParam boolean active) {

        return ResponseEntity.ok(
                deliveryPartnerService.updatePartnerActiveStatus(
                        partnerId, active));
    }

    // Update my profile
    @PutMapping("/me")
    public ResponseEntity<DeliveryPartnerResponse> updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DeliveryPartnerRequest request) {

        return ResponseEntity.ok(
                deliveryPartnerService.updateMyProfile(
                        jwt.getSubject(), request));
    }

    // Update availability
    @PatchMapping("/me/availability")
    public ResponseEntity<DeliveryPartnerResponse> updateAvailability(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AvailabilityRequest request) {

        return ResponseEntity.ok(
                deliveryPartnerService.updateAvailability(
                        jwt.getSubject(), request));
    }
    
 // ADMIN: Get available delivery partners
    @GetMapping("/admin/available")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<DeliveryPartnerResponse>> getAvailablePartners() {

        return ResponseEntity.ok(
                deliveryPartnerService.getAvailablePartners());
    }
}
