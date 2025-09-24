package org.ulinda.controllers;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.ulinda.dto.*;
import org.ulinda.exceptions.ErrorCode;
import org.ulinda.exceptions.FrontendException;
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


    /**
     * EXCLUDED FROM JWT CHECK
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        if (userService.validateUser(loginRequest.getUsername(), loginRequest.getPassword())) {
            UUID userId = userService.getUserId(loginRequest.getUsername());
            //Check if user must change password
            GetUserResponse user = userService.getUser(userId);
            if (user.isMustChangePassword()) {
                throw new FrontendException("User must change password", ErrorCode.USER_MUST_CHANGE_PASSWORD, true);
            }
            String token = jwtService.generateToken(userId.toString());
            userService.saveNewToken(userId, token);
            LoginResponse response = new LoginResponse(token, userId.toString(), jwtExpiration);
            return ResponseEntity.ok(response);
        } else {
            throw new FrontendException("Invalid Credentials", ErrorCode.INVALID_LOGIN_CREDENTIALS, true);
        }
    }

    @PostMapping("/change-password")
    public void changePassword(@Valid @RequestBody ChangePasswordRequest changePasswordRequest, Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        if (userService.validatePassword(userId, changePasswordRequest.getOldPassword())) {
            userService.changePassword(userId, changePasswordRequest.getNewPassword());
        } else {
            throw new FrontendException("Incorrect old password", ErrorCode.OLD_PASSWORD_INCORRECT, true);
        }
    }

    @PostMapping("/forced-change-password")
    public ResponseEntity<LoginResponse> forcedChangePassword(@Valid @RequestBody ForcedChangePasswordRequest request) {
        LoginResponse response = userService.forcedChangePassword(request.getUsername(), request.getOldPassword(), request.getNewPassword());
        response.setExpiresIn(jwtExpiration);
        return ResponseEntity.ok(response);
    }
}
