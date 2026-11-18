
package com.fooddelivery.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.user.dto.RoleApplicationRequest;
import com.fooddelivery.user.dto.RoleApplicationResponse;
import com.fooddelivery.user.dto.RejectRoleApplicationRequest;
import com.fooddelivery.user.service.RoleApplicationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/role-applications")
@RequiredArgsConstructor
public class RoleApplicationController {

    private final RoleApplicationService roleApplicationService;

    // USER: Submit an application.
    @PostMapping
    public ResponseEntity<RoleApplicationResponse> submitApplication(
            @Valid @RequestBody RoleApplicationRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        RoleApplicationResponse response =
                roleApplicationService.submitApplication(request, jwt);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // USER: View own applications.
    @GetMapping("/me")
    public ResponseEntity<List<RoleApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                roleApplicationService.getMyApplications(jwt)
        );
    }
    
 // ADMIN: View complete role application history.
    @GetMapping("/admin/all")
    public ResponseEntity<List<RoleApplicationResponse>> getAllApplications(
            Authentication authentication) {

        requireAdmin(authentication);

        return ResponseEntity.ok(
                roleApplicationService.getAllApplications()
        );
    }

    // ADMIN: View all pending applications.
    @GetMapping("/admin/pending")
    public ResponseEntity<List<RoleApplicationResponse>> getPendingApplications(
            Authentication authentication) {

        requireAdmin(authentication);

        return ResponseEntity.ok(
                roleApplicationService.getPendingApplications()
        );
    }

    // ADMIN: Approve an application.
    @PatchMapping("/admin/{id}/approve")
    public ResponseEntity<RoleApplicationResponse> approveApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        requireAdmin(authentication);

        return ResponseEntity.ok(
                roleApplicationService.approveApplication(id, jwt)
        );
    }

    // ADMIN: Reject an application.
    @PatchMapping("/admin/{id}/reject")
    public ResponseEntity<RoleApplicationResponse> rejectApplication(
            @PathVariable Long id,
            @Valid @RequestBody RejectRoleApplicationRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {

        requireAdmin(authentication);

        return ResponseEntity.ok(
                roleApplicationService.rejectApplication(
                        id,
                        request.getReason(),
                        jwt
                )
        );
    }

    // Ensure only administrators can review applications.
    private void requireAdmin(Authentication authentication) {

        boolean isAdmin = authentication != null
                && authentication.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .anyMatch("ROLE_ADMIN"::equals);

        if (!isAdmin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin role required"
            );
        }
    }
}
