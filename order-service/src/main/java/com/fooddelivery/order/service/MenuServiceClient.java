
package com.fooddelivery.order.service;

import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.fooddelivery.order.dto.MenuItemDetails;

@Component
public class MenuServiceClient {

    private static final String MENU_URL =
            "http://menu-service/api/menu-items/";

    private final RestTemplate restTemplate;

    public MenuServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public MenuItemDetails getMenuItem(Long menuItemId) {

        try {
            MenuItemDetails item = restTemplate.exchange(
                    MENU_URL + menuItemId,
                    HttpMethod.GET,
                    null,
                    MenuItemDetails.class
            ).getBody();

            if (item == null || !item.isAvailable()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Menu item is unavailable"
                );
            }

            return item;

        } catch (RestClientResponseException ex) {

            if (ex.getStatusCode().value() == 404) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Menu item not found or unavailable"
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Menu Service request failed"
            );
        }
    }
}
