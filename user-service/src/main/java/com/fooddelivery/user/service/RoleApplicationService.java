
package com.fooddelivery.user.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.user.client.KeycloakAdminClient;
import com.fooddelivery.user.dto.RoleApplicationRequest;
import com.fooddelivery.user.dto.RoleApplicationResponse;
import com.fooddelivery.user.dto.UserResponse;
import com.fooddelivery.user.entity.RoleApplication;
import com.fooddelivery.user.entity.User;
import com.fooddelivery.user.repository.RoleApplicationRepository;
import com.fooddelivery.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoleApplicationService {

    private final RoleApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final KeycloakAdminClient keycloakAdminClient;

    // Only these roles can be requested.
    private boolean isAllowedRole(String role) {
        return "RESTAURANT_OWNER".equals(role)
                || "DELIVERY_PARTNER".equals(role);
    }

    // Resolve the logged-in user from the verified Keycloak token.
    private User getLoggedInUser(Jwt jwt) {

        UserResponse profile = userService.getCurrentUser(jwt);

        return userRepository.findById(profile.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User profile not found"
                ));
    }

 // Convert entity into response DTO.
    private RoleApplicationResponse mapToResponse(
            RoleApplication application) {

        User applicant = application.getUser();
        User reviewer = application.getReviewedBy();

        return RoleApplicationResponse.builder()
                .id(application.getId())
                .userId(applicant.getId())
                .fullName(applicant.getFullName())
                .email(applicant.getEmail())
                .phone(applicant.getPhone())
                .requestedRole(application.getRequestedRole())
                .applicationStatus(application.getApplicationStatus())
                .submittedAt(application.getSubmittedAt())
                .reviewedAt(application.getReviewedAt())
                .reviewedById(reviewer != null ? reviewer.getId() : null)
                .reviewedByName(reviewer != null ? reviewer.getFullName() : null)
                .rejectionReason(application.getRejectionReason())
                .build();
    }

    // USER: Submit a restaurant owner or delivery partner application.
    @Transactional
    public RoleApplicationResponse submitApplication(
            RoleApplicationRequest request,
            Jwt jwt) {

        User applicant = getLoggedInUser(jwt);

        if ("ADMIN".equalsIgnoreCase(applicant.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrators cannot submit role applications"
            );
        }

        String requestedRole = request.getRequestedRole()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!isAllowedRole(requestedRole)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid application role"
            );
        }

        if (requestedRole.equalsIgnoreCase(applicant.getRole())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You already have this role"
            );
        }

        // Prevent duplicate pending or approved applications.
        boolean alreadyApplied =
                applicationRepository
                        .existsByUser_IdAndRequestedRoleAndApplicationStatusIn(
                                applicant.getId(),
                                requestedRole,
                                List.of("PENDING", "APPROVED")
                        );

        if (alreadyApplied) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "You already have a pending or approved application for this role"
            );
        }

        RoleApplication application = RoleApplication.builder()
                .user(applicant)
                .requestedRole(requestedRole)
                .applicationStatus("PENDING")
                .build();

        RoleApplication saved =
                applicationRepository.save(application);

        return mapToResponse(saved);
    }

    // USER: View own role applications.
    @Transactional(readOnly = true)
    public List<RoleApplicationResponse> getMyApplications(Jwt jwt) {

        User applicant = getLoggedInUser(jwt);

        return applicationRepository
                .findByUser_IdOrderBySubmittedAtDesc(applicant.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ADMIN: View all pending applications.
    @Transactional(readOnly = true)
    public List<RoleApplicationResponse> getPendingApplications() {

        return applicationRepository
                .findByApplicationStatusIgnoreCaseOrderBySubmittedAtDesc(
                        "PENDING"
                )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }
    
 // ADMIN: View complete role application history.
    @Transactional(readOnly = true)
    public List<RoleApplicationResponse> getAllApplications() {

        return applicationRepository
                .findAllByOrderBySubmittedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ADMIN: Approve an application and assign the Keycloak role.
    @Transactional
    public RoleApplicationResponse approveApplication(
            Long applicationId,
            Jwt adminJwt) {

        RoleApplication application = applicationRepository
                .findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Role application not found"
                ));

        if (!"PENDING".equalsIgnoreCase(
                application.getApplicationStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending applications can be approved"
            );
        }

        User admin = getLoggedInUser(adminJwt);
        User applicant = application.getUser();

        if (applicant.getKeycloakUserId() == null
                || applicant.getKeycloakUserId().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Applicant does not have a linked Keycloak account"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(applicant.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Inactive applicants cannot be approved"
            );
        }

        String requestedRole = application.getRequestedRole();

        if (!isAllowedRole(requestedRole)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid application role"
            );
        }

        boolean roleAssigned = false;

        try {

            // Grant the approved role in Keycloak.
            keycloakAdminClient.assignRealmRole(
                    applicant.getKeycloakUserId(),
                    requestedRole
            );

            roleAssigned = true;

            // Update SQL Server user profile.
            applicant.setRole(requestedRole);
            userRepository.save(applicant);

            // Record approval information.
            application.setApplicationStatus("APPROVED");
            application.setReviewedAt(LocalDateTime.now());
            application.setReviewedBy(admin);
            application.setRejectionReason(null);

            RoleApplication saved =
                    applicationRepository.saveAndFlush(application);

            return mapToResponse(saved);

        } catch (RuntimeException exception) {

            // Compensate in Keycloak if the database operation fails.
            if (roleAssigned) {
                try {
                    keycloakAdminClient.removeRealmRole(
                            applicant.getKeycloakUserId(),
                            requestedRole
                    );
                } catch (Exception cleanupException) {
                    exception.addSuppressed(cleanupException);
                }
            }

            throw exception;
        }
    }

    // ADMIN: Reject a pending application.
    @Transactional
    public RoleApplicationResponse rejectApplication(
            Long applicationId,
            String rejectionReason,
            Jwt adminJwt) {

        RoleApplication application = applicationRepository
                .findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Role application not found"
                ));

        if (!"PENDING".equalsIgnoreCase(
                application.getApplicationStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending applications can be rejected"
            );
        }

        User admin = getLoggedInUser(adminJwt);

        if (rejectionReason == null
                || rejectionReason.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A rejection reason is required"
            );
        }

        if (rejectionReason.trim().length() > 1000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rejection reason cannot exceed 1000 characters"
            );
        }

        application.setApplicationStatus("REJECTED");
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(admin);
        application.setRejectionReason(rejectionReason.trim());

        RoleApplication saved =
                applicationRepository.save(application);

        return mapToResponse(saved);
    }
}
