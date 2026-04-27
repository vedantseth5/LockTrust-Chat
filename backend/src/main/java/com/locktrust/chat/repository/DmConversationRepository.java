package com.locktrust.chat.repository;

import com.locktrust.chat.model.DmConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface DmConversationRepository extends JpaRepository<DmConversation, Long> {

    @Query("SELECT c FROM DmConversation c JOIN c.participants p WHERE p.id = :userId")
    List<DmConversation> findByParticipantId(@Param("userId") Long userId);

    @Query("SELECT c FROM DmConversation c JOIN c.participants p1 JOIN c.participants p2 WHERE c.isGroup = false AND p1.id = :userId1 AND p2.id = :userId2")
    Optional<DmConversation> findDirectConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
