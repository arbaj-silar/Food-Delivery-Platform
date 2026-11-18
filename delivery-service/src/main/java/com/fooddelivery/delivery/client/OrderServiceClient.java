package com.fooddelivery.delivery.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fooddelivery.delivery.dto.DeliveryOrderDetailsResponse;

import lombok.RequiredArgsConstructor;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.internal-service-key}")
    private String internalServiceKey;

    public DeliveryOrderDetailsResponse getOrderDetails(Long orderId) {

        String url = "http://order-service/api/orders/internal/"
                + orderId + "/delivery-details";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Service-Key", internalServiceKey);
        JwtAuthenticationToken authentication =
                (JwtAuthenticationToken) SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        headers.setBearerAuth(
                authentication.getToken().getTokenValue()
        );
        
        

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                DeliveryOrderDetailsResponse.class
        ).getBody();
    }
    
    public List<DeliveryOrderDetailsResponse> getReadyForDeliveryOrders() {

        String url = "http://order-service/api/orders/internal/ready-for-delivery";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Service-Key", internalServiceKey);

        JwtAuthenticationToken authentication =
                (JwtAuthenticationToken) SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        headers.setBearerAuth(
                authentication.getToken().getTokenValue()
        );

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                new org.springframework.core.ParameterizedTypeReference<
                        List<DeliveryOrderDetailsResponse>>() {}
        ).getBody();
    }

    public void updateOrderStatus(Long orderId, String status) {

        String url = "http://order-service/api/orders/internal/"
                + orderId + "/delivery-status";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Service-Key", internalServiceKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        JwtAuthenticationToken authentication =
                (JwtAuthenticationToken) SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        headers.setBearerAuth(
                authentication.getToken().getTokenValue()
        );

        String requestBody = "{\"status\":\"" + status + "\"}";

        HttpEntity<String> entity =
                new HttpEntity<>(requestBody, headers);

        restTemplate.exchange(
                url,
                HttpMethod.PATCH,
                entity,
                Void.class
        );
    }
}