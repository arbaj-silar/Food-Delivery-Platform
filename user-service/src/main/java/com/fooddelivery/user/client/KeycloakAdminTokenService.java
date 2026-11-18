
package com.fooddelivery.user.client;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class KeycloakAdminTokenService {

    private final RestClient restClient;

    @Value("${app.keycloak.server-url}")
    private String serverUrl;

    @Value("${app.keycloak.realm}")
    private String realm;

    @Value("${app.keycloak.admin-client-id}")
    private String clientId;

    @Value("${app.keycloak.admin-client-secret}")
    private String clientSecret;

    public KeycloakAdminTokenService(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    public String getAccessToken() {

        String tokenUrl = serverUrl
                + "/realms/" + realm
                + "/protocol/openid-connect/token";

        MultiValueMap<String, String> formData =
                new LinkedMultiValueMap<>();

        formData.add("grant_type", "client_credentials");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);

        Map<?, ?> response = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(formData)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException(
                    "Failed to obtain Keycloak admin access token");
        }

        return response.get("access_token").toString();
    }
}
