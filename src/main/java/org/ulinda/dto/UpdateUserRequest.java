package org.ulinda.dto;

import jakarta.validation.constraints.NotNull;
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

    @NotNull
    private List<UpdateUserModelPermissionDto> permissions;
}
