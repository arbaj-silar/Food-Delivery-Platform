
package com.fooddelivery.gateway.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        config.setAllowedMethods(List.of(
            "GET", "POST", "PUT",
            "PATCH", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(
            ServerHttpSecurity http,
            CorsConfigurationSource corsConfigurationSource) {

        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)

            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            .authorizeExchange(exchanges -> exchanges
            	    .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            	    // Public authentication endpoints
            	    .pathMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
            	    .pathMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
            	    .pathMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
            	    .pathMatchers(HttpMethod.POST, "/api/users").permitAll()

            	    // All remaining endpoints require authentication
            	    .anyExchange().authenticated()
            	)

            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(Customizer.withDefaults())
            )

            .build();
    }
}
