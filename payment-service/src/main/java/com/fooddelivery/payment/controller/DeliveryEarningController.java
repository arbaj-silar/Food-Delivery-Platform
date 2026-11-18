
package com.fooddelivery.payment.controller;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.payment.client.DeliveryPartnerClient;
import com.fooddelivery.payment.dto.CreateDeliveryEarningRequest;
import com.fooddelivery.payment.dto.DeliveryEarningResponse;
import com.fooddelivery.payment.dto.DeliveryEarningStatisticsResponse;
import com.fooddelivery.payment.service.DeliveryEarningService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/delivery-earnings")
@RequiredArgsConstructor
public class DeliveryEarningController {

    private final DeliveryEarningService earningService;
    private final DeliveryPartnerClient deliveryPartnerClient;
    
    @Value("${app.internal-service-key}")
    private String internalServiceKey;

    private Long getPartnerId(
            org.springframework.security.oauth2.jwt.Jwt jwt) {

        return deliveryPartnerClient.getDeliveryPartnerId(
                jwt.getTokenValue());
    }

    @GetMapping("/my")
    public ResponseEntity<List<DeliveryEarningResponse>> getMyEarnings(
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {

        Long partnerId = getPartnerId(jwt);

        return ResponseEntity.ok(
                earningService.getMyEarnings(partnerId));
    }

    @GetMapping("/my/statistics")
    public ResponseEntity<DeliveryEarningStatisticsResponse> getStatistics(
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {

        Long partnerId = getPartnerId(jwt);

        return ResponseEntity.ok(
                earningService.getStatistics(partnerId));
    }

    @GetMapping("/my/today")
    public ResponseEntity<BigDecimal> getTodayEarnings(
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {

        Long partnerId = getPartnerId(jwt);

        return ResponseEntity.ok(
                earningService.getTodayEarnings(partnerId));
    }

    @GetMapping("/my/monthly")
    public ResponseEntity<BigDecimal> getMonthlyEarnings(
            @AuthenticationPrincipal org.springframework.security.oauth2.jwt.Jwt jwt) {

        Long partnerId = getPartnerId(jwt);

        return ResponseEntity.ok(
                earningService.getMonthlyEarnings(partnerId));
    }

    @PostMapping("/internal")
    public ResponseEntity<DeliveryEarningResponse> createEarning(
            @RequestHeader("X-Internal-Service-Key") String serviceKey,
            @Valid @RequestBody CreateDeliveryEarningRequest request) {

        boolean validKey = MessageDigest.isEqual(
                internalServiceKey.getBytes(StandardCharsets.UTF_8),
                serviceKey.getBytes(StandardCharsets.UTF_8)
        );

        if (!validKey) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Invalid internal service key"
            );
        }

        DeliveryEarningResponse response = earningService.createEarning(
                request.getDeliveryAssignmentId(),
                request.getOrderId(),
                request.getDeliveryPartnerId(),
                request.getAmount(),
                request.getCompletedAt()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
