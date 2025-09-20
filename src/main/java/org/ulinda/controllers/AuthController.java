package org.ulinda.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.ulinda.dto.LoginRequest;
import org.ulinda.dto.LoginResponse;
import org.ulinda.security.JwtService;
import org.ulinda.services.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final long jwtExpiration;

    public AuthController(UserService userService,
                          JwtService jwtService,
                          @Value("${jwt.expiration}") long jwtExpiration) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.jwtExpiration = jwtExpiration;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (userService.validateUser(loginRequest.getUsername(), loginRequest.getPassword())) {
            String userId = userService.getUserId(loginRequest.getUsername());
            String token = jwtService.generateToken(userId);
            LoginResponse response = new LoginResponse(token, userId, jwtExpiration);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }
    }
}
