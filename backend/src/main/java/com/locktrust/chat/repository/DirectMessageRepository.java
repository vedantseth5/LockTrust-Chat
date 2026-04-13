package com.locktrust.chat.repository;

import com.locktrust.chat.model.DirectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    Page<DirectMessage> findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(Long conversationId, Pageable pageable);
}
