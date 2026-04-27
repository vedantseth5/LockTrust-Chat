package com.locktrust.chat.repository;

import com.locktrust.chat.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStatusRepository extends JpaRepository<UserStatus, Long> {
}
