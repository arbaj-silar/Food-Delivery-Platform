package com.fooddelivery.payment.client;

import java.util.Map;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DeliveryPartnerClient {

    private final RestTemplate restTemplate;

    public Long getDeliveryPartnerId(String accessToken) {

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response =
                restTemplate.exchange(
                        "http://delivery-service/api/delivery-partners/me",
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );

        Map<String, Object> profile = response.getBody();

        if (profile == null || profile.get("id") == null) {
            throw new IllegalStateException(
                    "Unable to retrieve delivery partner profile");
        }

        return Long.valueOf(profile.get("id").toString());
    }
}