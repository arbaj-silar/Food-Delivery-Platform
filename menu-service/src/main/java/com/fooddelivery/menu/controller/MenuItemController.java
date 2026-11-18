
package com.fooddelivery.menu.controller;

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

import com.fooddelivery.menu.dto.AvailabilityRequest;
import com.fooddelivery.menu.dto.MenuItemRequest;
import com.fooddelivery.menu.dto.MenuItemResponse;
import com.fooddelivery.menu.service.MenuItemService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {

    private final MenuItemService service;

    public MenuItemController(MenuItemService service) {
        this.service = service;
    }

    // =========================================
    // GET AVAILABLE MENU ITEMS - PUBLIC
    // =========================================

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<MenuItemResponse>> getAvailableItems(
            @PathVariable Long restaurantId) {

        return ResponseEntity.ok(
                service.getAvailableItems(restaurantId)
        );
    }

    // =========================================
    // GET OWNER MENU ITEMS - OWNER / ADMIN
    // =========================================

    @GetMapping("/restaurant/{restaurantId}/mine")
    public ResponseEntity<List<MenuItemResponse>> getMyItems(
            @PathVariable Long restaurantId,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        return ResponseEntity.ok(
                service.getMyItems(
                        restaurantId,
                        jwt,
                        isAdmin(authentication)
                )
        );
    }

    // =========================================
    // GET MENU ITEM BY ID - PUBLIC
    // =========================================

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemResponse> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.getById(id)
        );
    }

    // =========================================
    // CREATE MENU ITEM - OWNER / ADMIN
    // =========================================

    @PostMapping
    public ResponseEntity<MenuItemResponse> create(
            @Valid @RequestBody MenuItemRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        MenuItemResponse response = service.create(
                request,
                jwt,
                isAdmin(authentication)
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================
    // UPDATE MENU ITEM - OWNER / ADMIN
    // =========================================

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        return ResponseEntity.ok(
                service.update(
                        id,
                        request,
                        jwt,
                        isAdmin(authentication)
                )
        );
    }

    // =========================================
    // UPDATE AVAILABILITY - OWNER / ADMIN
    // =========================================

    @PatchMapping("/{id}/availability")
    public ResponseEntity<MenuItemResponse> updateAvailability(
            @PathVariable Long id,
            @RequestBody AvailabilityRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        return ResponseEntity.ok(
                service.updateAvailability(
                        id,
                        request,
                        jwt,
                        isAdmin(authentication)
                )
        );
    }

    // =========================================
    // DELETE MENU ITEM - OWNER / ADMIN
    // =========================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        service.delete(
                id,
                jwt,
                isAdmin(authentication)
        );

        return ResponseEntity.noContent().build();
    }

    // =========================================
    // CHECK ADMIN ROLE
    // =========================================

    private boolean isAdmin(Authentication authentication) {

        return authentication != null
                && authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }
}
