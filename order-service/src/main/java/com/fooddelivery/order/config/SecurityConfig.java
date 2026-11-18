
package com.fooddelivery.order.config;

import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import com.fooddelivery.order.security.KeycloakRoleConverter;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        JwtAuthenticationConverter jwtConverter =
                new JwtAuthenticationConverter();

        jwtConverter.setJwtGrantedAuthoritiesConverter(
                new KeycloakRoleConverter());

        http
            .csrf(AbstractHttpConfigurer::disable)

            .authorizeHttpRequests(auth -> auth

                // Allow Spring error dispatches
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()

                // Restaurant owner: view and manage own restaurant orders
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/orders/restaurant/**")
                    .hasRole("RESTAURANT_OWNER")

                .requestMatchers(
                        HttpMethod.PATCH,
                        "/api/orders/*/status")
                    .hasRole("RESTAURANT_OWNER")

                // Internal service endpoints
                // Controller validates X-Internal-Service-Key
                .requestMatchers(
                        HttpMethod.PATCH,
                        "/api/orders/internal/*/payment-status")
                    .permitAll()

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/orders/internal/*/payment-details")
                    .permitAll()

                // Customer order endpoints
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/orders")
                    .hasRole("CUSTOMER")

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/orders/my",
                        "/api/orders/*")
                    .hasRole("CUSTOMER")

                // All remaining endpoints require authentication
                .anyRequest().authenticated()
            )

            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtConverter)
                )
            );

        return http.build();
    }
}
