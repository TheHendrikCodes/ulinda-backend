package org.ulinda.controllers;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.ulinda.dto.LoginRequest;
import org.ulinda.dto.LoginResponse;
import org.ulinda.security.JwtService;
import org.ulinda.services.UserService;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final long jwtExpiration;

    public AuthController(UserService userService,
                          JwtService jwtService,
                          @Value("${ULINDA_JWT_EXPIRATION}") long jwtExpiration) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.jwtExpiration = jwtExpiration;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        if (userService.validateUser(loginRequest.getUsername(), loginRequest.getPassword())) {
            UUID userId = userService.getUserId(loginRequest.getUsername());
            String token = jwtService.generateToken(userId.toString());
            userService.saveNewToken(userId, token);
            LoginResponse response = new LoginResponse(token, userId.toString(), jwtExpiration);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }
    }
}
