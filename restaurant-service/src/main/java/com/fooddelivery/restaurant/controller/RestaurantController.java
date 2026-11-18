
package com.fooddelivery.restaurant.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fooddelivery.restaurant.dto.RestaurantRequest;
import com.fooddelivery.restaurant.dto.RestaurantResponse;
import com.fooddelivery.restaurant.service.RestaurantService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService service;

    public RestaurantController(RestaurantService service) {
        this.service = service;
    }

    @GetMapping
    public List<RestaurantResponse> getApprovedRestaurants() {
        return service.getApprovedRestaurants();
    }
    
 // ADMIN: Get all restaurants, including pending and rejected
    @GetMapping("/admin/all")
    public ResponseEntity<List<RestaurantResponse>> getAllRestaurants(
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin role required");
        }

        return ResponseEntity.ok(service.getAllRestaurants());
    }
    
 // ADMIN: Get restaurant details regardless of status
    @GetMapping("/admin/{id}")
    public ResponseEntity<RestaurantResponse> getAdminRestaurantById(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin role required");
        }

        return ResponseEntity.ok(service.getAdminRestaurantById(id));
    }

    @GetMapping("/{id}")
    public RestaurantResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/me")
    public List<RestaurantResponse> getMyRestaurants(
            @AuthenticationPrincipal Jwt jwt) {
        return service.getMyRestaurants(jwt);
    }

    @PostMapping
    public ResponseEntity<RestaurantResponse> create(
            @Valid @RequestBody RestaurantRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request, jwt));
    }

    @PutMapping("/{id}")
    public RestaurantResponse update(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        return service.update(
                id,
                request,
                jwt,
                isAdmin(authentication)
        );
    }
    
    @PatchMapping("/{id}/approve")
    public RestaurantResponse approve(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin role required");
        }

        return service.approve(id);
    }

 // ADMIN: Reject restaurant registration
    @PatchMapping("/{id}/reject")
    public ResponseEntity<RestaurantResponse> reject(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin role required");
        }

        return ResponseEntity.ok(service.reject(id));
    }
    
 // ADMIN: Reopen a rejected restaurant registration for review
    @PatchMapping("/{id}/reopen")
    public ResponseEntity<RestaurantResponse> reopenReview(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin role required");
        }

        return ResponseEntity.ok(service.reopenReview(id));
    }
    
 // ADMIN: Activate or deactivate an approved restaurant
    @PatchMapping("/{id}/status")
    public ResponseEntity<RestaurantResponse> updateRestaurantActiveStatus(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam boolean active,
            Authentication authentication) {

        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Admin role required");
        }

        return ResponseEntity.ok(
                service.updateRestaurantActiveStatus(id, active)
        );
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        service.delete(id, jwt, isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
