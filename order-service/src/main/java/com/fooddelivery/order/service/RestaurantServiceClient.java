
package com.fooddelivery.order.service;

import java.util.List;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.fooddelivery.order.dto.RestaurantDetails;

@Component
public class RestaurantServiceClient {

    private static final String RESTAURANT_URL =
            "http://restaurant-service/api/restaurants/me";

    private final RestTemplate restTemplate;

    public RestaurantServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean ownsRestaurant(Long restaurantId, String token) {

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            List<RestaurantDetails> restaurants =
                    restTemplate.exchange(
                            RESTAURANT_URL,
                            HttpMethod.GET,
                            entity,
                            new ParameterizedTypeReference<List<RestaurantDetails>>() {}
                    ).getBody();

            return restaurants != null
                    && restaurants.stream()
                    .anyMatch(r -> restaurantId.equals(r.getId()));

        } catch (RestClientResponseException ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Restaurant Service ownership verification failed"
            );
        }
    }
    
    public RestaurantDetails getRestaurantDetails(Long restaurantId) {

        String url = "http://restaurant-service/api/restaurants/"
                + restaurantId;

        try {
            return restTemplate.getForObject(
                    url,
                    RestaurantDetails.class
            );

        } catch (RestClientResponseException ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Unable to retrieve restaurant location"
            );
        }
    }
}
