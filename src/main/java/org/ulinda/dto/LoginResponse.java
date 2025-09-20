package org.ulinda.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {
    private String token;
    private String userId;
    private long expiresIn;

    public LoginResponse(String token, String username, long expiresIn) {
        this.token = token;
        this.userId = username;
        this.expiresIn = expiresIn;
    }

}
