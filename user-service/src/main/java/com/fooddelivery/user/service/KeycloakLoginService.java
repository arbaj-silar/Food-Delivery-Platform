
package com.fooddelivery.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.user.dto.KeycloakTokenResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KeycloakLoginService {

    private final RestClient.Builder restClientBuilder;

    @Value("${app.keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${app.keycloak.realm}")
    private String realm;

    @Value("${app.keycloak.login-client-id}")
    private String clientId;

    @Value("${app.keycloak.login-client-secret}")
    private String clientSecret;

    public KeycloakTokenResponse login(String email, String password) {

        String tokenUrl = keycloakServerUrl
                + "/realms/"
                + realm
                + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData =
                new LinkedMultiValueMap<>();

        formData.add("grant_type", "password");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("username", email);
        formData.add("password", password);
        formData.add("scope", "openid profile email");

        try {

            return restClientBuilder.build()
                    .post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(KeycloakTokenResponse.class);

        } catch (RestClientResponseException ex) {
        	
        	System.err.println(
        		    "KEYCLOAK LOGIN ERROR: HTTP "
        		    + ex.getStatusCode().value()
        		    + " - "
        		    + ex.getResponseBodyAsString()
        		);

            if (ex.getStatusCode().value() == 400
                    || ex.getStatusCode().value() == 401) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password."
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Authentication service is temporarily unavailable."
            );
        }
    }
    
    public KeycloakTokenResponse refresh(String refreshToken) {

        String tokenUrl = keycloakServerUrl
                + "/realms/"
                + realm
                + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData =
                new LinkedMultiValueMap<>();

        formData.add("grant_type", "refresh_token");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("refresh_token", refreshToken);

        try {
            return restClientBuilder.build()
                    .post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(KeycloakTokenResponse.class);

        } catch (RestClientResponseException ex) {

            if (ex.getStatusCode().value() == 400
                    || ex.getStatusCode().value() == 401) {

                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Your session has expired. Please log in again."
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Authentication service is temporarily unavailable."
            );
        }
    }
    
    public void logout(String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        String logoutUrl = keycloakServerUrl
                + "/realms/"
                + realm
                + "/protocol/openid-connect/logout";

        MultiValueMap<String, String> formData =
                new LinkedMultiValueMap<>();

        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("refresh_token", refreshToken);

        try {
            restClientBuilder.build()
                    .post()
                    .uri(logoutUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .toBodilessEntity();

        } catch (RestClientException ex) {
            // Continue logout even if Keycloak is temporarily unavailable.
        }
    }
}
