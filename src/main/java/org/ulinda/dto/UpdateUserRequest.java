package org.ulinda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.ulinda.entities.UserModelPermission;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateUserRequest {
    @NotNull
    private UUID userId;
    private String name;
    private String surname;
    private boolean adminUser;
    private boolean canCreateModels;
    @Pattern(regexp = "^[a-zA-Z0-9]+$",
            message = "Username must contain only letters and numbers, no spaces allowed")
    @NotBlank(message = "Username cannot be blank")
    private String username;

    @NotNull
    private List<UpdateUserModelPermissionDto> permissions;
}
