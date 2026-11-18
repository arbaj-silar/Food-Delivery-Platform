package com.fooddelivery.payment.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.fooddelivery.payment.dto.PaymentRequest;
import com.fooddelivery.payment.dto.PaymentResponse;
import com.fooddelivery.payment.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        PaymentResponse response = paymentService.createPayment(
                request,
                jwt.getSubject()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(
            @PathVariable Long orderId) {

        return ResponseEntity.ok(
                paymentService.getPaymentByOrderId(orderId)
        );
    }
    
 // CUSTOMER: Complete payment
    @PatchMapping("/order/{orderId}/complete")
    public ResponseEntity<PaymentResponse> completePayment(
            @PathVariable Long orderId,
            @RequestParam boolean successful,
            @AuthenticationPrincipal Jwt jwt) {

        PaymentResponse response = paymentService.completePayment(
                orderId,
                successful,
                jwt.getSubject()
        );

        return ResponseEntity.ok(response);
    }
    
 // Refund a successful payment
    @PatchMapping("/order/{orderId}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(
            @PathVariable Long orderId,
            @AuthenticationPrincipal Jwt jwt) {

        PaymentResponse response = paymentService.refundPayment(
                orderId,
                jwt.getSubject()
        );

        return ResponseEntity.ok(response);
    }
    
 // ADMIN: Get all payment transactions
    @GetMapping("/admin/all")
    public ResponseEntity<java.util.List<PaymentResponse>> getAllPayments() {

        return ResponseEntity.ok(
                paymentService.getAllPayments()
        );
    }
}