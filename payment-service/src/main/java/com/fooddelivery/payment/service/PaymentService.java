package com.fooddelivery.payment.service;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddelivery.payment.client.OrderServiceClient;
import com.fooddelivery.payment.dto.OrderPaymentDetailsResponse;
import com.fooddelivery.payment.dto.PaymentRequest;
import com.fooddelivery.payment.dto.PaymentResponse;
import com.fooddelivery.payment.entity.Payment;
import com.fooddelivery.payment.enums.PaymentStatus;
import com.fooddelivery.payment.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    
    private final OrderServiceClient orderServiceClient;

    @Transactional
    public PaymentResponse createPayment(
            PaymentRequest request,
            String customerId) {

        if (paymentRepository.existsByOrderId(request.getOrderId())) {
            throw new IllegalStateException(
                    "Payment already exists for this order");
        }

        // Fetch actual order details from Order Service
        OrderPaymentDetailsResponse order =
                orderServiceClient.getOrderPaymentDetails(
                        request.getOrderId());

        // Verify order ownership
        if (!order.getCustomerId().equals(customerId)) {
            throw new SecurityException(
                    "You are not authorized to pay for this order");
        }

        // Verify order is awaiting payment
        if (!"PENDING".equals(order.getPaymentStatus())) {
            throw new IllegalStateException(
                    "This order is not awaiting payment");
        }

        // Always use the actual order amount
        BigDecimal actualAmount = order.getTotalAmount();

        if (actualAmount == null || actualAmount.signum() <= 0) {
            throw new IllegalStateException(
                    "Invalid order amount");
        }

        Payment payment = Payment.builder()
                .orderId(order.getId())
                .customerId(customerId)
                .amount(actualAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .transactionReference("PAY-" + UUID.randomUUID())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        return mapToResponse(savedPayment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long orderId) {

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Payment not found for order: " + orderId));

        return mapToResponse(payment);
    }

    private PaymentResponse mapToResponse(Payment payment) {

        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .customerId(payment.getCustomerId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .transactionReference(payment.getTransactionReference())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
    
 // Process payment result and synchronize with Order Service
    @Transactional
    public PaymentResponse completePayment(
            Long orderId,
            boolean successful,
            String customerId) {

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Payment not found for order: " + orderId));

        // Verify payment ownership
        if (!payment.getCustomerId().equals(customerId)) {
            throw new SecurityException(
                    "You are not authorized to process this payment");
        }

        // Only pending payments can be completed
        PaymentStatus newStatus = successful
                ? PaymentStatus.SUCCESS
                : PaymentStatus.FAILED;

        // Validate the payment status transition
        validatePaymentTransition(
                payment.getPaymentStatus(),
                newStatus
        );

        // Synchronize with Order Service first
        String orderPaymentStatus = successful ? "PAID" : "FAILED";

        orderServiceClient.updatePaymentStatus(
                orderId,
                orderPaymentStatus
        );

        // Update Payment Service database
        payment.setPaymentStatus(newStatus);

        if (!successful) {
            payment.setFailureReason("Payment failed");
        }

        Payment savedPayment = paymentRepository.save(payment);

        return mapToResponse(savedPayment);
    }
    
 // Refund a successful payment
    @Transactional
    public PaymentResponse refundPayment(
            Long orderId,
            String customerId) {

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Payment not found for order: " + orderId));

        if (!payment.getCustomerId().equals(customerId)) {
            throw new SecurityException(
                    "You are not authorized to refund this payment");
        }

        validatePaymentTransition(
                payment.getPaymentStatus(),
                PaymentStatus.REFUNDED
        );

        // Synchronize with Order Service first
        orderServiceClient.updatePaymentStatus(
                orderId,
                "REFUNDED"
        );

        payment.setPaymentStatus(PaymentStatus.REFUNDED);

        Payment savedPayment = paymentRepository.save(payment);

        return mapToResponse(savedPayment);
    }
    
    private void validatePaymentTransition(
            PaymentStatus currentStatus,
            PaymentStatus newStatus) {

        boolean validTransition =
                currentStatus == PaymentStatus.PENDING
                        && (newStatus == PaymentStatus.SUCCESS
                        || newStatus == PaymentStatus.FAILED
                        || newStatus == PaymentStatus.CANCELLED)
                || currentStatus == PaymentStatus.SUCCESS
                        && newStatus == PaymentStatus.REFUNDED;

        if (!validTransition) {
            throw new IllegalStateException(
                    "Invalid payment status transition: "
                            + currentStatus + " -> " + newStatus);
        }
    }
    
    @Transactional(readOnly = true)
    public java.util.List<PaymentResponse> getAllPayments() {

        return paymentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
}