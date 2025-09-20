package org.ulinda.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    private final String secret;
    private final long expiration;
    private final Key key;


    public JwtService(@Value("${JWT_SECRET:}") String secret,
                      @Value("${JWT_EXPIRATION:0}") long expiration) {
        if (secret.isEmpty()) {
            log.error("JWT_SECRET environment variable is not set");
            throw new IllegalStateException("JWT_SECRET environment variable is required");
        }
        if (expiration <= 0) {
            log.error("JWT_EXPIRATION environment variable is not set");
            throw new IllegalStateException("JWT_EXPIRATION must be greater than 0");
        }
        this.secret = secret;
        this.expiration = expiration;
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public UUID extractUserId(String token) {
        String uuidString = extractClaim(token, Claims::getSubject);
        return UUID.fromString(uuidString);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
