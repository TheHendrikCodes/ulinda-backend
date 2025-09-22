package org.ulinda.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.ulinda.dto.*;
import org.ulinda.entities.Model;
import org.ulinda.entities.User;
import org.ulinda.entities.UserModelPermission;
import org.ulinda.exceptions.ErrorCode;
import org.ulinda.exceptions.FrontendException;
import org.ulinda.repositories.ModelRepository;
import org.ulinda.repositories.UserModelPermissionRepository;
import org.ulinda.repositories.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class UserService {

    @Value("${ADMIN_SECRET:}")
    private String adminUserPassword;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordService passwordService;
    private final UserModelPermissionRepository userModelPermissionRepository;
    private final ModelRepository modelRepository;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            PasswordService passwordService,
            UserModelPermissionRepository userModelPermissionRepository,
            ModelRepository modelRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordService = passwordService;
        this.userModelPermissionRepository = userModelPermissionRepository;
        this.modelRepository = modelRepository;
    }

    public UUID createAdminUser() {
        if (StringUtils.isEmpty(adminUserPassword)) {
            throw new RuntimeException("ADMIN_SECRET environment variable not set");
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

    public boolean validateUser(String username, String password) {
        username = username.toLowerCase();
        Optional<User> user = userRepository.findByUsername(username);
        return user.isPresent() && passwordEncoder.matches(password, user.get().getPassword());
    }

    public String getUserId(String username) {
        username = username.toLowerCase();
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return user.get().getId().toString();
        } else {
            throw new RuntimeException("Username not found");
        }
    }

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
