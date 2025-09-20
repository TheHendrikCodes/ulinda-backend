package org.ulinda.repositories;

import org.springframework.data.repository.CrudRepository;
import org.ulinda.entities.ErrorLog;

import java.util.UUID;

public interface ErrorRepository extends CrudRepository<ErrorLog, UUID> {
}
