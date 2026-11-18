
package com.fooddelivery.user.controller;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.user.dto.KeycloakTokenResponse;
import com.fooddelivery.user.dto.LoginRequest;
import com.fooddelivery.user.dto.LoginResponse;
import com.fooddelivery.user.dto.UserResponse;
import com.fooddelivery.user.service.KeycloakLoginService;
import com.fooddelivery.user.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakLoginService keycloakLoginService;
    private final JwtDecoder jwtDecoder;
    private final UserService userService;

    @Value("${app.keycloak.refresh-cookie-secure:false}")
    private boolean secureCookie;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request) {

        KeycloakTokenResponse tokenResponse =
                keycloakLoginService.login(
                        request.getEmail(),
                        request.getPassword()
                );
        
     // Validate the newly issued access token.
        Jwt jwt = jwtDecoder.decode(
                tokenResponse.getAccessToken()
        );

        // Retrieve the user's SQL Server profile.
        UserResponse user = userService.getCurrentUser(jwt);

        // Reject inactive accounts immediately.
        if (user.getStatus() == null
                || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {

            // Revoke the newly created Keycloak session.
            keycloakLoginService.logout(
                    tokenResponse.getRefreshToken()
            );

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is inactive. Access denied."
            );
        }

        ResponseCookie refreshCookie = ResponseCookie
                .from(
                        "food_delivery_refresh_token",
                        tokenResponse.getRefreshToken()
                )
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofSeconds(
                        tokenResponse.getRefreshExpiresIn()
                ))
                .build();

        LoginResponse loginResponse = new LoginResponse(
                tokenResponse.getAccessToken(),
                tokenResponse.getExpiresIn(),
                tokenResponse.getTokenType()
        );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshCookie.toString()
                )
                .body(loginResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(
                    name = "food_delivery_refresh_token",
                    required = false
            ) String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        // Ask Keycloak to refresh the session.
        KeycloakTokenResponse tokenResponse =
                keycloakLoginService.refresh(refreshToken);

        // Validate the newly issued access token.
        Jwt jwt = jwtDecoder.decode(
                tokenResponse.getAccessToken()
        );

        // Retrieve the user's SQL Server profile.
        UserResponse user = userService.getCurrentUser(jwt);

        // Do not allow inactive accounts to refresh their session.
        if (user.getStatus() == null
                || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {

            // Revoke the newly issued Keycloak refresh token.
            keycloakLoginService.logout(
                    tokenResponse.getRefreshToken()
            );

            // Clear the browser's refresh-token cookie.
            ResponseCookie clearCookie = ResponseCookie
                    .from("food_delivery_refresh_token", "")
                    .httpOnly(true)
                    .secure(secureCookie)
                    .sameSite("Lax")
                    .path("/api/auth")
                    .maxAge(Duration.ZERO)
                    .build();

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .header(
                            HttpHeaders.SET_COOKIE,
                            clearCookie.toString()
                    )
                    .build();
        }

        // Rotate the refresh token cookie.
        ResponseCookie refreshCookie = ResponseCookie
                .from(
                        "food_delivery_refresh_token",
                        tokenResponse.getRefreshToken()
                )
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ofSeconds(
                        tokenResponse.getRefreshExpiresIn()
                ))
                .build();

        LoginResponse loginResponse = new LoginResponse(
                tokenResponse.getAccessToken(),
                tokenResponse.getExpiresIn(),
                tokenResponse.getTokenType()
        );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshCookie.toString()
                )
                .body(loginResponse);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(
                    name = "food_delivery_refresh_token",
                    required = false
            ) String refreshToken) {

        // Revoke the Keycloak refresh-token session.
        keycloakLoginService.logout(refreshToken);

        // Remove the refresh-token cookie from the browser.
        ResponseCookie clearCookie = ResponseCookie
                .from("food_delivery_refresh_token", "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity.noContent()
                .header(
                        HttpHeaders.SET_COOKIE,
                        clearCookie.toString()
                )
                .build();
    }
}
