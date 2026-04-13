package com.locktrust.chat.repository;

import com.locktrust.chat.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByMessageId(Long messageId);
    Optional<Reaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    Optional<Reaction> findByThreadReplyIdAndUserIdAndEmoji(Long threadReplyId, Long userId, String emoji);
    void deleteByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    void deleteByThreadReplyIdAndUserIdAndEmoji(Long threadReplyId, Long userId, String emoji);
}
