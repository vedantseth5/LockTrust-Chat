package com.locktrust.chat.repository;

import com.locktrust.chat.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByEmailAndPurposeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, String purpose, LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE OtpToken o SET o.used = true WHERE o.email = :email AND o.purpose = :purpose")
    void invalidateAllForEmailAndPurpose(@Param("email") String email, @Param("purpose") String purpose);
}
