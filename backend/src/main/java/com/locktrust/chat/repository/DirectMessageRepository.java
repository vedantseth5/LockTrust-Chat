package com.locktrust.chat.repository;

import com.locktrust.chat.model.DirectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    Page<DirectMessage> findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(Long conversationId, Pageable pageable);
    Page<DirectMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    @Query("SELECT m FROM DirectMessage m JOIN FETCH m.conversation c JOIN FETCH c.participants WHERE m.deleted = false AND LOWER(m.content) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY m.createdAt DESC")
    List<DirectMessage> adminSearchMessages(@Param("q") String query);

    @Query("SELECT m FROM DirectMessage m JOIN FETCH m.conversation c JOIN FETCH c.participants WHERE m.deleted = false AND m.sender.id = :userId ORDER BY m.createdAt DESC")
    List<DirectMessage> findByUserId(@Param("userId") Long userId);
}
