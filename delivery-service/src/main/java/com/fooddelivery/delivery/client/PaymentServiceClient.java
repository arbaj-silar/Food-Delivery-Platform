
package com.fooddelivery.delivery.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fooddelivery.delivery.dto.CreateDeliveryEarningRequest;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PaymentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.internal-service-key}")
    private String internalServiceKey;

    public void createDeliveryEarning(
            CreateDeliveryEarningRequest request) {

        String url =
                "http://payment-service/api/delivery-earnings/internal";

        JwtAuthenticationToken authentication =
                (JwtAuthenticationToken) SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Service-Key", internalServiceKey);
        headers.setBearerAuth(
                authentication.getToken().getTokenValue()
        );

        HttpEntity<CreateDeliveryEarningRequest> entity =
                new HttpEntity<>(request, headers);

        restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Void.class
        );
    }
}
