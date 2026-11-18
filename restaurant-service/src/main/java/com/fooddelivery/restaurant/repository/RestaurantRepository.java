
package com.fooddelivery.restaurant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fooddelivery.restaurant.entity.Restaurant;

public interface RestaurantRepository
        extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByKeycloakOwnerId(String keycloakOwnerId);

    List<Restaurant> findByStatusIgnoreCase(String status);

    List<Restaurant> findByCityIgnoreCaseAndStatusIgnoreCase(
            String city, String status);

    List<Restaurant> findByCuisineTypeIgnoreCaseAndStatusIgnoreCase(
            String cuisineType, String status);
    
    List<Restaurant> findAllByOrderByCreatedAtDesc();
    
    List<Restaurant> findByStatusIgnoreCaseAndActiveTrue(String status);

    boolean existsByEmailIgnoreCase(String email);
}
