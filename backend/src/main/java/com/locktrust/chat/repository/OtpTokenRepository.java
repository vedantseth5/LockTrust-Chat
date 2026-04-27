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
    Optional<OtpToken> findTopByPhoneAndPurposeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone, String purpose, LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE OtpToken o SET o.used = true WHERE o.phone = :phone AND o.purpose = :purpose")
    void invalidateAllForPhoneAndPurpose(@Param("phone") String phone, @Param("purpose") String purpose);
}
