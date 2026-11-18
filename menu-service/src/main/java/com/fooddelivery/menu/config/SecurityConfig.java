
package com.fooddelivery.menu.config;

import java.util.Collection;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(
            KeycloakRoleConverter roleConverter) {

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        Converter<Jwt, Collection<GrantedAuthority>> authoritiesConverter =
                roleConverter;

        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
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
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                    // Owner/admin-only menu management
                    .requestMatchers(HttpMethod.GET,
                            "/api/menu-items/restaurant/*/mine")
                    .hasAnyRole("RESTAURANT_OWNER", "ADMIN")

                    .requestMatchers(HttpMethod.POST, "/api/menu-items")
                    .hasAnyRole("RESTAURANT_OWNER", "ADMIN")

                    .requestMatchers(HttpMethod.PUT, "/api/menu-items/*")
                    .hasAnyRole("RESTAURANT_OWNER", "ADMIN")

                    .requestMatchers(HttpMethod.PATCH,
                            "/api/menu-items/*/availability")
                    .hasAnyRole("RESTAURANT_OWNER", "ADMIN")

                    .requestMatchers(HttpMethod.DELETE, "/api/menu-items/*")
                    .hasAnyRole("RESTAURANT_OWNER", "ADMIN")

                    // Public menu browsing
                    .requestMatchers(HttpMethod.GET,
                            "/api/menu-items/restaurant/*")
                    .permitAll()

                    .requestMatchers(HttpMethod.GET, "/api/menu-items/*")
                    .permitAll()

                    .anyRequest().authenticated())

            .oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(
                            jwtAuthenticationConverter)));

        return http.build();
    }
}
