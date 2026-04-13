package com.locktrust.chat.repository;

import com.locktrust.chat.model.ThreadReply;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ThreadReplyRepository extends JpaRepository<ThreadReply, Long> {
    List<ThreadReply> findByParentMessageIdAndDeletedFalseOrderByCreatedAtAsc(Long parentMessageId);
    long countByParentMessageIdAndDeletedFalse(Long parentMessageId);
}
