package com.fooddelivery.user.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import com.fooddelivery.user.dto.UpdateUserRequest;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fooddelivery.user.dto.RegisterUserRequest;
import com.fooddelivery.user.dto.UserResponse;
import com.fooddelivery.user.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> registerUser(
            @Valid @RequestBody RegisterUserRequest request) {

        UserResponse response = userService.registerUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    
    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {

        return ResponseEntity.ok(
                userService.searchUsers(keyword, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            Authentication authentication,
            @AuthenticationPrincipal Jwt jwt) {

        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            UserResponse currentUser = userService.getCurrentUser(jwt);

            if (!currentUser.getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        return ResponseEntity.ok(userService.getUserById(id));
    }
  
	
	@PutMapping("/{id}")
	public ResponseEntity<UserResponse> updateUser(
	        @PathVariable Long id,
	        @Valid @RequestBody UpdateUserRequest request,
	        @AuthenticationPrincipal Jwt jwt,
	        Authentication authentication) {
	
	    boolean isAdmin = authentication.getAuthorities()
	        .stream()
	        .anyMatch(authority ->
	            authority.getAuthority().equals("ROLE_ADMIN"));
	
	    UserResponse response = userService.updateUser(
	        id, request, jwt, isAdmin
	    );
	
	    return ResponseEntity.ok(response);
	}
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.deactivateUser(id)
        );
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserResponse> activateUser(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                userService.activateUser(id)
        );
    }
    

	@GetMapping("/me")
	public ResponseEntity<UserResponse> getCurrentUser(
	        @AuthenticationPrincipal Jwt jwt) {
	
	    return ResponseEntity.ok(
	            userService.getCurrentUser(jwt));
	}

}