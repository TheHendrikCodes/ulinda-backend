package org.ulinda.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForcedChangePasswordRequest {
    @NotBlank
    String username;
    @NotBlank
    String oldPassword;
    @NotBlank
    String newPassword;
}
