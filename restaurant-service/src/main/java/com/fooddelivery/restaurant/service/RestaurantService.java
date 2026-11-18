
package com.fooddelivery.restaurant.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.restaurant.dto.RestaurantRequest;
import com.fooddelivery.restaurant.dto.RestaurantResponse;
import com.fooddelivery.restaurant.entity.Restaurant;
import com.fooddelivery.restaurant.repository.RestaurantRepository;

@Service
public class RestaurantService {

    private final RestaurantRepository repository;

    public RestaurantService(RestaurantRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public RestaurantResponse create(
            RestaurantRequest request, Jwt jwt) {

        String ownerId = jwt.getSubject();

        Restaurant restaurant = new Restaurant();
        copyRequest(request, restaurant);

        restaurant.setKeycloakOwnerId(ownerId);
        restaurant.setStatus("PENDING");

        return toResponse(repository.save(restaurant));
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponse> getApprovedRestaurants() {
        return repository.findByStatusIgnoreCaseAndActiveTrue("APPROVED")
                .stream()
                .map(this::toResponse)
                .toList();
    }
    
 // ADMIN: Get all restaurants regardless of status
    @Transactional(readOnly = true)
    public List<RestaurantResponse> getAllRestaurants() {

        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponse> getMyRestaurants(Jwt jwt) {
        return repository.findByKeycloakOwnerId(jwt.getSubject())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RestaurantResponse getById(Long id) {

        Restaurant restaurant = findRestaurant(id);

        if (!"APPROVED".equalsIgnoreCase(restaurant.getStatus())
                || !restaurant.isActive()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Restaurant not found"
            );
        }

        return toResponse(restaurant);
    }
    
 // ADMIN: Get restaurant details regardless of status
    @Transactional(readOnly = true)
    public RestaurantResponse getAdminRestaurantById(Long id) {

        Restaurant restaurant = findRestaurant(id);

        return toResponse(restaurant);
    }
    
    @Transactional
    public RestaurantResponse update(
            Long id,
            RestaurantRequest request,
            Jwt jwt,
            boolean isAdmin) {

        Restaurant restaurant = findRestaurant(id);

        // Only owners and admins can update restaurants.
        if (!isAdmin) {
            verifyOwner(restaurant, jwt);
        }

        copyRequest(request, restaurant);

        // Changes require admin approval again.
        restaurant.setStatus("PENDING");

        return toResponse(repository.save(restaurant));
    }

    @Transactional
    public RestaurantResponse approve(Long id) {
        Restaurant restaurant = findRestaurant(id);
        restaurant.setStatus("APPROVED");
        return toResponse(repository.save(restaurant));
    }
    
 // ADMIN: Reject restaurant registration
    @Transactional
    public RestaurantResponse reject(Long id) {

        Restaurant restaurant = findRestaurant(id);

        if (!"PENDING".equalsIgnoreCase(restaurant.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only pending restaurants can be rejected"
            );
        }

        restaurant.setStatus("REJECTED");

        return toResponse(repository.save(restaurant));
    }
    
 // ADMIN: Reopen rejected restaurant registration for review
    @Transactional
    public RestaurantResponse reopenReview(Long id) {

        Restaurant restaurant = findRestaurant(id);

        if (!"REJECTED".equalsIgnoreCase(restaurant.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only rejected restaurants can be reopened for review"
            );
        }

        restaurant.setStatus("PENDING");

        return toResponse(repository.save(restaurant));
    }
    
 // ADMIN: Activate or deactivate an approved restaurant
    @Transactional
    public RestaurantResponse updateRestaurantActiveStatus(
            Long id, boolean active) {

        Restaurant restaurant = findRestaurant(id);

        if (!"APPROVED".equalsIgnoreCase(restaurant.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only approved restaurants can be activated or deactivated"
            );
        }

        restaurant.setActive(active);

        return toResponse(repository.save(restaurant));
    }

    @Transactional
    public void delete(Long id, Jwt jwt, boolean isAdmin) {
        Restaurant restaurant = findRestaurant(id);

        if (!isAdmin) {
            verifyOwner(restaurant, jwt);
        }

        repository.delete(restaurant);
    }

    private Restaurant findRestaurant(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Restaurant not found"));
    }

    private void verifyOwner(Restaurant restaurant, Jwt jwt) {
        if (!restaurant.getKeycloakOwnerId()
                .equals(jwt.getSubject())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot manage another owner's restaurant");
        }
    }

    private void copyRequest(
            RestaurantRequest request, Restaurant restaurant) {

        restaurant.setName(request.getName().trim());
        restaurant.setDescription(request.getDescription());
        restaurant.setAddress(request.getAddress().trim());
        restaurant.setLatitude(request.getLatitude());
        restaurant.setLongitude(request.getLongitude());
        restaurant.setCity(request.getCity().trim());
        restaurant.setPhone(request.getPhone().trim());
        restaurant.setEmail(request.getEmail().trim().toLowerCase());
        restaurant.setCuisineType(request.getCuisineType().trim());
        restaurant.setImageUrl(request.getImageUrl());
        restaurant.setOpeningTime(request.getOpeningTime());
        restaurant.setClosingTime(request.getClosingTime());
        restaurant.setDeliveryAvailable(request.isDeliveryAvailable());
    }

    private RestaurantResponse toResponse(Restaurant restaurant) {
        return RestaurantResponse.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .description(restaurant.getDescription())
                .address(restaurant.getAddress())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .city(restaurant.getCity())
                .phone(restaurant.getPhone())
                .email(restaurant.getEmail())
                .cuisineType(restaurant.getCuisineType())
                .imageUrl(restaurant.getImageUrl())
                .openingTime(restaurant.getOpeningTime())
                .closingTime(restaurant.getClosingTime())
                .deliveryAvailable(restaurant.isDeliveryAvailable())
                .active(restaurant.isActive())
                .status(restaurant.getStatus())
                .createdAt(restaurant.getCreatedAt())
                .updatedAt(restaurant.getUpdatedAt())
                .build();
    }
}
