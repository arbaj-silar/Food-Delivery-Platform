package com.fooddelivery.user.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.fooddelivery.user.client.KeycloakAdminClient;
import com.fooddelivery.user.dto.RegisterUserRequest;
import com.fooddelivery.user.dto.UpdateUserRequest;
import com.fooddelivery.user.dto.UserResponse;
import com.fooddelivery.user.entity.User;
import com.fooddelivery.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final KeycloakAdminClient keycloakAdminClient;


	@Transactional
	public UserResponse registerUser(RegisterUserRequest request) {
	
	    String email = request.getEmail().trim().toLowerCase();
	
	    if (userRepository.existsByEmail(email)) {
	        throw new ResponseStatusException(
	                HttpStatus.CONFLICT,
	                "An account with this email already exists"
	        );
	    }
	
	    String fullName = request.getFullName().trim();
	    String[] nameParts = fullName.split("\\s+", 2);
	
	    String firstName = nameParts[0];
	    String lastName = nameParts.length > 1 ? nameParts[1] : "";
	
	    String keycloakUserId = null;
	
	    try {
	
	        // 1. Create account in Keycloak
	        keycloakUserId = keycloakAdminClient.createUser(
	                email,
	                email,
	                firstName,
	                lastName,
	                request.getPassword()
	        );
	
	        // 2. Assign CUSTOMER role in Keycloak
	        keycloakAdminClient.assignRealmRole(
	                keycloakUserId,
	                "CUSTOMER"
	        );
	
	        // 3. Save profile in SQL Server
	        User user = User.builder()
	                .keycloakUserId(keycloakUserId)
	                .fullName(fullName)
	                .email(email)
	                .phone(request.getPhone().trim())
	                .passwordHash(null)
	                .role("CUSTOMER")
	                .status("ACTIVE")
	                .build();
	
	        User savedUser = userRepository.save(user);
	
	        return mapToResponse(savedUser);
	
	    } catch (Exception exception) {
	
	        // Clean up Keycloak account if SQL registration fails
	        if (keycloakUserId != null) {
	            try {
	                keycloakAdminClient.deleteUser(keycloakUserId);
	            } catch (Exception cleanupException) {
	                exception.addSuppressed(cleanupException);
	            }
	        }
	
	        throw exception;
	    }
	}

    
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + id
                ));

        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
    
    @Transactional
	public UserResponse updateUser(
	        Long id,
	        UpdateUserRequest request,
	        Jwt jwt,
	        boolean isAdmin) {
	
	    // Resolve the caller from the verified Keycloak token.
	    UserResponse currentUser = getCurrentUser(jwt);
	
	    // Non-admin users can update only their own profile.
	    if (!isAdmin && !currentUser.getId().equals(id)) {
	        throw new ResponseStatusException(
	            HttpStatus.FORBIDDEN,
	            "You can update only your own profile"
	        );
	    }
	
	    User user = userRepository.findById(id)
	        .orElseThrow(() -> new ResponseStatusException(
	            HttpStatus.NOT_FOUND,
	            "User not found"
	        ));
	
	    // Only fields explicitly allowed by this DTO are changed.
	    user.setFullName(request.getFullName().trim());
	    user.setPhone(request.getPhone().trim());
	
	    // Email, role, status and password remain unchanged.
	    User updatedUser = userRepository.save(user);
	
	    return mapToResponse(updatedUser);
	}
    
    @Transactional
    public void deleteUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + id
                ));

        userRepository.delete(user);
    }
    
    @Transactional
    public UserResponse deactivateUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + id
                ));

        user.setStatus("INACTIVE");

        User updatedUser = userRepository.save(user);

        return mapToResponse(updatedUser);
    }

    @Transactional
    public UserResponse activateUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with ID: " + id
                ));

        user.setStatus("ACTIVE");

        User updatedUser = userRepository.save(user);

        return mapToResponse(updatedUser);
    }
    
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(
            String keyword,
            String status,
            int page,
            int size) {

        if (page < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page number cannot be negative");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Page size must be between 1 and 100");
        }

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "id"));

        Page<User> users;

        if (status != null && !status.isBlank()) {
            users = userRepository.findByStatusIgnoreCase(
                    status.trim(), pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            String search = keyword.trim();

            users = userRepository
                    .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                            search, search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::mapToResponse);
    }
	    
	
	public UserResponse getCurrentUser(Jwt jwt) {
	
	    String keycloakUserId = jwt.getSubject();
	
	    // First, look up the existing Keycloak identity link.
	    User user = userRepository
	            .findByKeycloakUserId(keycloakUserId)
	            .orElse(null);
	
	    if (user != null) {
	        return mapToResponse(user);
	    }
	
	    // For an unlinked account, require a verified email.
	    String email = jwt.getClaimAsString("email");
	
	    if (email == null || email.isBlank()) {
	        throw new ResponseStatusException(
	                HttpStatus.BAD_REQUEST,
	                "Keycloak token does not contain an email");
	    }
	
	    if (!Boolean.TRUE.equals(
	            jwt.getClaimAsBoolean("email_verified"))) {
	        throw new ResponseStatusException(
	                HttpStatus.FORBIDDEN,
	                "Verify your email in Keycloak before linking your account");
	    }
	
	    email = email.trim().toLowerCase(java.util.Locale.ROOT);
	
	    User existingUser = userRepository.findByEmail(email)
	            .orElseThrow(() -> new ResponseStatusException(
	                    HttpStatus.NOT_FOUND,
	                    "No existing user profile matches this email"));
	
	    // Never overwrite an identity linked to another Keycloak user.
	    if (existingUser.getKeycloakUserId() != null
	            && !existingUser.getKeycloakUserId()
	                    .equals(keycloakUserId)) {
	        throw new ResponseStatusException(
	                HttpStatus.CONFLICT,
	                "This profile is already linked to another Keycloak account");
	    }
	
	    existingUser.setKeycloakUserId(keycloakUserId);
	
	    User savedUser = userRepository.save(existingUser);
	
	    return mapToResponse(savedUser);
	}

}