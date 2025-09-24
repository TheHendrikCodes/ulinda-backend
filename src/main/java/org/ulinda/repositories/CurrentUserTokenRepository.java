package org.ulinda.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.ulinda.entities.CurrentUserToken;

import java.util.List;
import java.util.UUID;

@Repository
public interface CurrentUserTokenRepository extends CrudRepository<CurrentUserToken, UUID> {
    List<CurrentUserToken> findAllByUserId(UUID userId);
    void deleteAllByUserId(UUID userId);
}