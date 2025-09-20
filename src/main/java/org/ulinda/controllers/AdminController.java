package org.ulinda.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.ulinda.dto.*;
import org.ulinda.services.UserService;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public ResponseEntity<GetUsersResponse> getUsers() {
        GetUsersResponse response = new GetUsersResponse();
        response.setUsers(userService.getUsers());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users")
    public ResponseEntity<CreateUserResponse> createUser(@Valid @RequestBody CreateUserRequest createUserRequest) {
        return ResponseEntity.ok(userService.createUser(createUserRequest));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<GetUserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @GetMapping("/user/model-permissions/{userId}")
    public ResponseEntity<GetUserModelPermissionsResponse> getUserModelPermissions(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getUserModelPermissions(userId));
    }

    @PostMapping("/user/model-permissions")
    public void updateUser(@Valid @RequestBody UpdateUserRequest updateUserRequest) {
        userService.updateUser(updateUserRequest);
    }
}



