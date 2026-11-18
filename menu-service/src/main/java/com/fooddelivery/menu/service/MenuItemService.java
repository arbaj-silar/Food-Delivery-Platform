
package com.fooddelivery.menu.service;

import java.util.List;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.menu.dto.AvailabilityRequest;
import com.fooddelivery.menu.dto.MenuItemRequest;
import com.fooddelivery.menu.dto.MenuItemResponse;
import com.fooddelivery.menu.dto.RestaurantSummary;
import com.fooddelivery.menu.entity.MenuItem;
import com.fooddelivery.menu.repository.MenuItemRepository;

@Service
public class MenuItemService {

    private static final String RESTAURANT_URL =
            "http://restaurant-service/api/restaurants";

    private final MenuItemRepository repository;
    private final RestTemplate restTemplate;

    public MenuItemService(
            MenuItemRepository repository,
            RestTemplate restTemplate) {

        this.repository = repository;
        this.restTemplate = restTemplate;
    }

    // =========================================
    // CREATE MENU ITEM
    // =========================================

    @Transactional
    public MenuItemResponse create(
            MenuItemRequest request,
            Jwt jwt,
            boolean isAdmin) {

        verifyRestaurantAccess(
                request.getRestaurantId(),
                jwt,
                isAdmin
        );

        if (repository.existsByRestaurantIdAndNameIgnoreCase(
                request.getRestaurantId(),
                request.getName().trim())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An item with this name already exists for this restaurant"
            );
        }

        MenuItem item = new MenuItem();

        copyRequest(request, item);

        return toResponse(repository.save(item));
    }

    // =========================================
    // GET AVAILABLE MENU ITEMS - PUBLIC
    // =========================================

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAvailableItems(Long restaurantId) {

        verifyRestaurantApproved(restaurantId, null);

        return repository
                .findByRestaurantIdAndAvailableTrue(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================
    // GET MENU ITEM BY ID - PUBLIC
    // =========================================

    @Transactional(readOnly = true)
    public MenuItemResponse getById(Long id) {

        MenuItem item = findItem(id);

        verifyRestaurantApproved(
                item.getRestaurantId(),
                null
        );

        if (!item.isAvailable()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Menu item not found"
            );
        }

        return toResponse(item);
    }

    // =========================================
    // GET OWNER MENU ITEMS
    // =========================================

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMyItems(
            Long restaurantId,
            Jwt jwt,
            boolean isAdmin) {

        verifyRestaurantAccess(
                restaurantId,
                jwt,
                isAdmin
        );

        return repository
                .findByRestaurantId(restaurantId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================
    // UPDATE MENU ITEM
    // =========================================

    @Transactional
    public MenuItemResponse update(
            Long id,
            MenuItemRequest request,
            Jwt jwt,
            boolean isAdmin) {

        MenuItem item = findItem(id);

        if (!item.getRestaurantId().equals(
                request.getRestaurantId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Changing an item's restaurant is not supported"
            );
        }

        verifyRestaurantAccess(
                item.getRestaurantId(),
                jwt,
                isAdmin
        );

        if (repository.existsByRestaurantIdAndNameIgnoreCase(
                item.getRestaurantId(),
                request.getName().trim())
                && !item.getName().equalsIgnoreCase(
                        request.getName().trim())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An item with this name already exists for this restaurant"
            );
        }

        copyRequest(request, item);

        return toResponse(repository.save(item));
    }

    // =========================================
    // UPDATE MENU ITEM AVAILABILITY
    // =========================================

    @Transactional
    public MenuItemResponse updateAvailability(
            Long id,
            AvailabilityRequest request,
            Jwt jwt,
            boolean isAdmin) {

        MenuItem item = findItem(id);

        verifyRestaurantAccess(
                item.getRestaurantId(),
                jwt,
                isAdmin
        );

        item.setAvailable(request.isAvailable());

        return toResponse(repository.save(item));
    }

    // =========================================
    // DELETE MENU ITEM
    // =========================================

    @Transactional
    public void delete(
            Long id,
            Jwt jwt,
            boolean isAdmin) {

        MenuItem item = findItem(id);

        verifyRestaurantAccess(
                item.getRestaurantId(),
                jwt,
                isAdmin
        );

        repository.delete(item);
    }

    // =========================================
    // VERIFY RESTAURANT OWNER ACCESS
    // =========================================

    private void verifyRestaurantAccess(
            Long restaurantId,
            Jwt jwt,
            boolean isAdmin) {

        // Verify approval using the current user's JWT.
        verifyRestaurantApproved(restaurantId, jwt);

        if (isAdmin) {
            return;
        }

        if (jwt == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        HttpHeaders headers = new HttpHeaders();

        headers.setBearerAuth(jwt.getTokenValue());

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {

            List<RestaurantSummary> ownedRestaurants =
                    restTemplate.exchange(
                            RESTAURANT_URL + "/me",
                            HttpMethod.GET,
                            entity,
                            new ParameterizedTypeReference<List<RestaurantSummary>>() {}
                    ).getBody();

            boolean isOwner =
                    ownedRestaurants != null
                    && ownedRestaurants.stream()
                    .anyMatch(restaurant ->
                            restaurantId.equals(restaurant.getId()));

            if (!isOwner) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You do not own this restaurant"
                );
            }

        } catch (RestClientResponseException ex) {

            System.err.println(
                    "Restaurant ownership API error: "
                    + ex.getStatusCode()
            );

            System.err.println(
                    "Restaurant ownership API response: "
                    + ex.getResponseBodyAsString()
            );

            if (ex.getStatusCode().value() == 401) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Restaurant Service rejected your authentication token"
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Restaurant Service ownership verification failed"
            );
        }
    }

    // =========================================
    // VERIFY RESTAURANT APPROVAL
    // =========================================

    private void verifyRestaurantApproved(
            Long restaurantId,
            Jwt jwt) {

        try {

            HttpHeaders headers = new HttpHeaders();

            // Forward JWT for authenticated owner operations.
            // Public customer browsing uses no JWT.
            if (jwt != null) {
                headers.setBearerAuth(jwt.getTokenValue());
            }

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            RestaurantSummary restaurant =
                    restTemplate.exchange(
                            RESTAURANT_URL + "/" + restaurantId,
                            HttpMethod.GET,
                            entity,
                            RestaurantSummary.class
                    ).getBody();

            if (restaurant == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Restaurant not found"
                );
            }

            if (!"APPROVED".equalsIgnoreCase(
                    restaurant.getStatus())) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Restaurant must be APPROVED before adding menu items"
                );
            }

        } catch (RestClientResponseException ex) {

            System.err.println(
                    "Restaurant status API error: "
                    + ex.getStatusCode()
            );

            System.err.println(
                    "Restaurant status API response: "
                    + ex.getResponseBodyAsString()
            );

            if (ex.getStatusCode().value() == 401) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Restaurant Service rejected the authentication token"
                );
            }

            if (ex.getStatusCode().value() == 403) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Access denied while checking restaurant status"
                );
            }

            if (ex.getStatusCode().value() == 404) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Approved restaurant not found"
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Restaurant Service status verification failed"
            );
        }
    }

    // =========================================
    // FIND MENU ITEM
    // =========================================

    private MenuItem findItem(Long id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Menu item not found"
                        ));
    }

    // =========================================
    // COPY REQUEST DATA
    // =========================================

    private void copyRequest(
            MenuItemRequest request,
            MenuItem item) {

        item.setRestaurantId(request.getRestaurantId());
        item.setName(request.getName().trim());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setCategory(request.getCategory().trim());
        item.setImageUrl(request.getImageUrl());
        item.setVegetarian(request.isVegetarian());
        item.setAvailable(request.isAvailable());
    }

    // =========================================
    // ENTITY TO RESPONSE
    // =========================================

    private MenuItemResponse toResponse(MenuItem item) {

        return MenuItemResponse.builder()
                .id(item.getId())
                .restaurantId(item.getRestaurantId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .imageUrl(item.getImageUrl())
                .vegetarian(item.isVegetarian())
                .available(item.isAvailable())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
