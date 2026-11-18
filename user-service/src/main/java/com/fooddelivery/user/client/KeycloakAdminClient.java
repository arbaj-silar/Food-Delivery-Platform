
package com.fooddelivery.user.client;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class KeycloakAdminClient {

    private final KeycloakAdminTokenService tokenService;
    private final RestClient.Builder restClientBuilder;

    @Value("${app.keycloak.server-url}")
    private String serverUrl;

    @Value("${app.keycloak.realm}")
    private String realm;

    private RestClient restClient() {
        return restClientBuilder.build();
    }

    private String adminRealmUrl() {
        return serverUrl + "/admin/realms/" + realm;
    }

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(tokenService.getAccessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public String createUser(String username, String email,
                             String firstName, String lastName,
                             String password) {

        Map<String, Object> user = Map.of(
                "username", username,
                "email", email,
                "firstName", firstName,
                "lastName", lastName,
                "enabled", true,
                "emailVerified", false,
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", false
                ))
        );

        var response = restClient().post()
                .uri(adminRealmUrl() + "/users")
                .headers(headers -> headers.addAll(getHeaders()))
                .body(user)
                .retrieve()
                .toBodilessEntity();

        String location = response.getHeaders().getFirst("Location");

        if (location == null || location.isBlank()) {
            throw new IllegalStateException(
                    "Keycloak created the user but did not return its user ID");
        }

        return location.substring(location.lastIndexOf('/') + 1);
    }

    public void assignRealmRole(String userId, String roleName) {

        Map<?, ?> role = restClient().get()
                .uri(adminRealmUrl() + "/roles/" + roleName)
                .headers(headers -> headers.addAll(getHeaders()))
                .retrieve()
                .body(Map.class);

        if (role == null || role.get("id") == null) {
            throw new IllegalStateException(
                    "Keycloak realm role not found: " + roleName);
        }

        restClient().post()
                .uri(adminRealmUrl() + "/users/" + userId
                        + "/role-mappings/realm")
                .headers(headers -> headers.addAll(getHeaders()))
                .body(List.of(role))
                .retrieve()
                .toBodilessEntity();
    }	    
	
	public void removeRealmRole(String userId, String roleName) {
	
	    // Find the Keycloak realm role.
	    Map<?, ?> role = restClient().get()
	            .uri(adminRealmUrl() + "/roles/" + roleName)
	            .headers(headers -> headers.addAll(getHeaders()))
	            .retrieve()
	            .body(Map.class);
	
	    if (role == null || role.get("id") == null) {
	        throw new IllegalStateException(
	                "Keycloak realm role not found: " + roleName
	        );
	    }
	
	    // Remove the role from the user.
	    restClient().method(HttpMethod.DELETE)
	            .uri(adminRealmUrl() + "/users/" + userId
	                    + "/role-mappings/realm")
	            .headers(headers -> headers.addAll(getHeaders()))
	            .body(List.of(role))
	            .retrieve()
	            .toBodilessEntity();
	}


    public void deleteUser(String userId) {

        restClient().delete()
                .uri(adminRealmUrl() + "/users/" + userId)
                .headers(headers -> headers.addAll(getHeaders()))
                .retrieve()
                .toBodilessEntity();
    }
    
    public void resetPassword(String userId, String newPassword) {

        Map<String, Object> credential = Map.of(
                "type", "password",
                "value", newPassword,
                "temporary", false
        );

        restClient().put()
                .uri(adminRealmUrl() + "/users/" + userId + "/reset-password")
                .headers(headers -> headers.addAll(getHeaders()))
                .body(credential)
                .retrieve()
                .toBodilessEntity();
    }
}
