package org.ulinda.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.ulinda.dto.GetUsersResponse;
import org.ulinda.services.UserService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserService userService; // Inject UserService to load roles

    public JwtAuthenticationFilter(JwtService jwtService, UserService userService) {
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            throw new RuntimeException("Authentication already exists");
        }

        // Skip JWT validation for auth endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        log.debug("inside doFilterInternal() method");

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        UUID userId = null;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        boolean isAuthenticated = false;
        try {
            userId = jwtService.extractUserId(jwt); // This also validates the token signature
            isAuthenticated = true;
        } catch (Exception e) {
            log.error("JWT extraction failed", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            isAuthenticated = false;
        }

        if (userId != null && isAuthenticated) {
            try {
                //Check is user is ADMIN user
                boolean isAdmin = false;
                org.ulinda.dto.GetUserResponse user = userService.getUser(userId);
                if (user != null) {
                    if (user.isAdminUser()) {
                        isAdmin = true;
                    }
                }

                List<GrantedAuthority> authorities = new ArrayList<>();
                if (isAdmin) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                }

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (Exception e) {
                log.error("Error loading user roles for userId: {}", userId, e);
                // Don't set authentication if there's an error loading roles
            }
        }
        filterChain.doFilter(request, response);
    }
}