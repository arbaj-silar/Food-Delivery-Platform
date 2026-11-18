
package com.fooddelivery.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class PaymentSecurityConfig {

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(
                new KeycloakRoleConverter()
        );

        return converter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter)
            throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Internal service endpoint
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/delivery-earnings/internal"
                ).authenticated()

                // Delivery partner endpoints
                .requestMatchers("/api/delivery-earnings/**")
                    .hasRole("DELIVERY_PARTNER")

                // Admin: View all payment transactions
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/payments/admin/**"
                ).hasRole("ADMIN")

                // Customer payment creation
                .requestMatchers(HttpMethod.POST, "/api/payments")
                    .hasRole("CUSTOMER")

                // Retrieve payment by order
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/payments/order/**"
                ).authenticated()

                .anyRequest().authenticated()
            )

            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(
                        jwtAuthenticationConverter
                    )
                )
            );

        return http.build();
    }
}
