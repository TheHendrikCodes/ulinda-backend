package org.ulinda.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.ulinda.dto.*;
import org.ulinda.entities.CurrentUserToken;
import org.ulinda.entities.Model;
import org.ulinda.entities.User;
import org.ulinda.entities.UserModelPermission;
import org.ulinda.exceptions.ErrorCode;
import org.ulinda.exceptions.FrontendException;
import org.ulinda.repositories.CurrentUserTokenRepository;
import org.ulinda.repositories.ModelRepository;
import org.ulinda.repositories.UserModelPermissionRepository;
import org.ulinda.repositories.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class UserService {

    @Value("${ULINDA_ADMIN_SECRET:}")
    private String adminUserPassword;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordService passwordService;
    private final UserModelPermissionRepository userModelPermissionRepository;
    private final ModelRepository modelRepository;
    private final CurrentUserTokenRepository currentUserTokenRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PasswordService passwordService,
            UserModelPermissionRepository userModelPermissionRepository,
            ModelRepository modelRepository,
            CurrentUserTokenRepository currentUserTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordService = passwordService;
        this.userModelPermissionRepository = userModelPermissionRepository;
        this.modelRepository = modelRepository;
        this.currentUserTokenRepository = currentUserTokenRepository;
    }

    @Transactional
    public UUID createAdminUser() {
        if (StringUtils.isEmpty(adminUserPassword)) {
            throw new RuntimeException("ULINDA_ADMIN_SECRET environment variable not set");
        }
        if (!userRepository.existsByUsername("admin")) {
            String encryptedPassword = passwordEncoder.encode(adminUserPassword);
            User admin = new User("admin", encryptedPassword, "Admin", "User", true, true);
            userRepository.save(admin);
            UUID userId = admin.getId();
            if (userId == null) {
                throw new RuntimeException("User ID is null");
            }
            return userId;
        }
        throw new RuntimeException("Admin user already exists");
    }

    @Transactional
    public CreateUserResponse createUser(CreateUserRequest createUserRequest) {
        String username = createUserRequest.getUsername().toLowerCase();
        String password = passwordService.generatePassword();
        if (!userRepository.existsByUsername(username)) {
            String encryptedPassword = passwordEncoder.encode(password);
            User user = new User(username, encryptedPassword, createUserRequest.getName(), createUserRequest.getSurname(), createUserRequest.isCanCreateModels(), createUserRequest.isAdminUser());
            userRepository.save(user);
            CreateUserResponse response = new CreateUserResponse();
            response.setUsername(username);
            response.setPassword(password);
            return response;
        }
        throw new FrontendException("Username already exists", ErrorCode.USER_ALREADY_EXISTS, true);
    }

    @Transactional(readOnly = true)
    public boolean validateUser(String username, String password) {
        username = username.toLowerCase();
        Optional<User> user = userRepository.findByUsername(username);
        return user.isPresent() && passwordEncoder.matches(password, user.get().getPassword());
    }

    @Transactional(readOnly = true)
    public boolean validateCurrentToken(UUID uuid, String token) {
        if (!StringUtils.hasText(token)) {
            throw new RuntimeException("Token is empty");
        }
        //Validate user ID
        userRepository.findById(uuid).orElseThrow(() -> new RuntimeException("User not found"));

        // Get all existing tokens for the user
        List<CurrentUserToken> existingTokens = currentUserTokenRepository.findAllById(uuid);
        for (CurrentUserToken existingToken : existingTokens) {
            if (existingToken.getCurrentToken().equals(token)) {
                return true;
            }
        }
        throw new FrontendException("Invalid token", true);
    }

    @Transactional
    public void saveNewToken(UUID uuid, String newToken) {
        User user = userRepository.findById(uuid).orElseThrow(() -> new RuntimeException("User not found"));

        // Get all existing tokens for the user
        List<CurrentUserToken> existingTokens = currentUserTokenRepository.findAllById(uuid);

        // If user already has 10 tokens, delete the oldest one
        if (existingTokens.size() >= 10) {
            // Find the oldest token (the one with the earliest createdAt timestamp)
            CurrentUserToken oldestToken = existingTokens.stream()
                    .min((t1, t2) -> t1.getCreatedAt().compareTo(t2.getCreatedAt()))
                    .orElse(null);

            if (oldestToken != null) {
                currentUserTokenRepository.delete(oldestToken);
            }
        }

        // Create and save the new token
        CurrentUserToken currentUserToken = new CurrentUserToken();
        currentUserToken.setId(uuid);
        currentUserToken.setCurrentToken(newToken);
        currentUserToken.setCreatedAt(Instant.now());
        currentUserTokenRepository.save(currentUserToken);
    }

    @Transactional(readOnly = true)
    public UUID getUserId(String username) {
        username = username.toLowerCase();
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return user.get().getId();
        } else {
            throw new RuntimeException("Username not found");
        }
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsers() {
        List<UserDto> users = new ArrayList<>();
        userRepository.findAll().forEach(user -> {
            UserDto userDto = new UserDto();
            userDto.setUserName(user.getUsername());
            userDto.setName(user.getName());
            userDto.setSurname(user.getSurname());
            userDto.setUserId(user.getId());
            userDto.setCanCreateModels(user.isCanCreateModels());
            userDto.setAdminUser(user.isAdminUser());
            users.add(userDto);
        });
        return users;
    }

    @Transactional(readOnly = true)
    public GetUserResponse getUser(UUID userId) {
        GetUserResponse response = new GetUserResponse();
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found: " + userId));
        response.setUserId(userId);
        response.setUserName(user.getUsername());
        response.setName(user.getName());
        response.setSurname(user.getSurname());
        response.setCanCreateModels(user.isCanCreateModels());
        response.setAdminUser(user.isAdminUser());
        return response;
    }

    @Transactional(readOnly = true)
    public GetUserModelPermissionsResponse getUserModelPermissions(UUID userId) {
        GetUserModelPermissionsResponse response = new GetUserModelPermissionsResponse();
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found: " + userId));
        List<UserModelPermission> permissions = userModelPermissionRepository.findByUserId(user.getId());
        List<UserModelPermissionDto> userModelPermissions = new ArrayList<>();
        for (UserModelPermission permission : permissions) {
            Model model = modelRepository.findById(permission.getModelId()).orElseThrow(() -> new RuntimeException("Model not found: " + permission.getModelId()));
            UserModelPermissionDto userModelPermissionDto = new UserModelPermissionDto();
            userModelPermissionDto.setModelName(model.getName());
            userModelPermissionDto.setModelId(model.getId());
            userModelPermissionDto.setModelDescription(model.getDescription());
            userModelPermissionDto.setPermission(permission.getPermission());
            userModelPermissions.add(userModelPermissionDto);
        }
        response.setUserModelPermissions(userModelPermissions);
        return response;
    }

    @Transactional
    public void updateUser(UpdateUserRequest updateUserRequest) {
        UUID userId = updateUserRequest.getUserId();
        User user = userRepository.findById(updateUserRequest.getUserId()).orElseThrow(() -> new RuntimeException("User not found: " + updateUserRequest.getUserId()));

        if (user.getUsername().toLowerCase().equals("admin")) {
            log.info("Administrator (admin) user's settings can't be changed");
            return;
        }
        user.setUsername(updateUserRequest.getUsername().toLowerCase());
        user.setName(updateUserRequest.getName());
        user.setSurname(updateUserRequest.getSurname());
        user.setCanCreateModels(updateUserRequest.isCanCreateModels());
        user.setAdminUser(updateUserRequest.isAdminUser());
        userRepository.save(user);
        userModelPermissionRepository.deleteByUserId(userId);

        for (UpdateUserModelPermissionDto permission : updateUserRequest.getPermissions()) {
            UserModelPermission userModelPermission = new UserModelPermission();
            userModelPermission.setUserId(userId);
            userModelPermission.setModelId(permission.getModelId());
            userModelPermission.setPermission(permission.getPermission());
            userModelPermissionRepository.save(userModelPermission);
        }
    }
}
