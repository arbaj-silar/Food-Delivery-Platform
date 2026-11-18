
package com.fooddelivery.payment.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fooddelivery.payment.dto.OrderPaymentDetailsResponse;

import java.util.Map;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrderServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.order-service.url}")
    private String orderServiceUrl;

    @Value("${app.internal-service-key}")
    private String internalServiceKey;

    public void updatePaymentStatus(Long orderId, String paymentStatus) {

        String url = orderServiceUrl
                + "/api/orders/internal/"
                + orderId
                + "/payment-status";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Service-Key", internalServiceKey);

        Map<String, String> requestBody = Map.of(
                "paymentStatus", paymentStatus
        );

        HttpEntity<Map<String, String>> request =
                new HttpEntity<>(requestBody, headers);

        restTemplate.exchange(
                url,
                HttpMethod.PATCH,
                request,
                Void.class
        );
    }
    
 // Fetch actual order details for payment validation
    public OrderPaymentDetailsResponse getOrderPaymentDetails(Long orderId) {

        String url = orderServiceUrl
                + "/api/orders/internal/" + orderId + "/payment-details";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Service-Key", internalServiceKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<OrderPaymentDetailsResponse> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        request,
                        OrderPaymentDetailsResponse.class
                );

        return response.getBody();
    }
}
