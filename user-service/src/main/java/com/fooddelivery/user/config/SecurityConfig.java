
package com.fooddelivery.user.config;

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
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(
            KeycloakRoleConverter keycloakRoleConverter) {

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();

        Converter<Jwt, Collection<GrantedAuthority>> authoritiesConverter =
                keycloakRoleConverter;

        converter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter);

        return converter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            UserStatusFilter userStatusFilter) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/users/health")
                .permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/users")
                .permitAll()
                
                .requestMatchers(
                		HttpMethod.POST, 
                		"/api/auth/login")
                .permitAll()
                	
                .requestMatchers(
                		HttpMethod.POST, 
                		"/api/auth/refresh"
                ).permitAll()
                
                .requestMatchers(
                		HttpMethod.POST, 
                		"/api/auth/logout")
                .permitAll()
                
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/users")
                .hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/users/*")
                .hasRole("ADMIN")

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/users/*/activate",
                    "/api/users/*/deactivate")
                .hasRole("ADMIN")

                .anyRequest().authenticated()
            )


            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(
                        jwtAuthenticationConverter)))
            
            .addFilterAfter(
                userStatusFilter,
                BearerTokenAuthenticationFilter.class
            );

        return http.build();

    }
}
