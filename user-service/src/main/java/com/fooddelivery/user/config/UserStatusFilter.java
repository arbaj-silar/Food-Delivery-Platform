
package com.fooddelivery.user.config;

import java.io.IOException;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.user.dto.UserResponse;
import com.fooddelivery.user.service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class UserStatusFilter extends OncePerRequestFilter {

    private final UserService userService;

    public UserStatusFilter(UserService userService) {
        this.userService = userService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();
        String method = request.getMethod();

        // Public login endpoint
        if (HttpMethod.POST.matches(method)
                && "/api/auth/login".equals(path)) {
            return true;
        }

        // Public refresh endpoint
        if (HttpMethod.POST.matches(method)
                && "/api/auth/refresh".equals(path)) {
            return true;
        }

        // Public health endpoint
        if (HttpMethod.GET.matches(method)
                && "/api/users/health".equals(path)) {
            return true;
        }

        // Public registration endpoint
        return HttpMethod.POST.matches(method)
                && "/api/users".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        // Only inspect authenticated Keycloak JWT requests.
        if (authentication == null
                || !(authentication.getPrincipal() instanceof Jwt jwt)) {

            filterChain.doFilter(request, response);
            return;
        }

        try {

            // Resolve the user's SQL Server profile.
            UserResponse user = userService.getCurrentUser(jwt);

            // Reject inactive accounts.
            if (user.getStatus() == null
                    || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {

                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");

                response.getWriter().write(
                        "{\"error\":\"Your account is inactive. Access denied.\"}"
                );

                return;
            }

        } catch (ResponseStatusException ex) {

            response.setStatus(ex.getStatusCode().value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            response.getWriter().write(
                    "{\"error\":\"Unable to authorize this user account.\"}"
            );

            return;
        }

        filterChain.doFilter(request, response);
    }
}
