package com.locktrust.chat.repository;

import com.locktrust.chat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByChannelIdAndDeletedFalseOrderByCreatedAtAsc(Long channelId, Pageable pageable);
    Page<Message> findByChannelIdOrderByCreatedAtAsc(Long channelId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.channel.id = :channelId AND m.deleted = false AND LOWER(m.content) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Message> searchInChannel(@Param("channelId") Long channelId, @Param("q") String query);

    @Query("SELECT m FROM Message m JOIN m.channel c JOIN c.members u WHERE u.id = :userId AND m.deleted = false AND LOWER(m.content) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Message> searchMessagesForUser(@Param("userId") Long userId, @Param("q") String query);

    @Query("SELECT m FROM Message m WHERE m.deleted = false AND LOWER(m.content) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY m.createdAt DESC")
    List<Message> adminSearchMessages(@Param("q") String query);

    @Query("SELECT m FROM Message m JOIN m.sender s WHERE m.deleted = false AND s.id = :userId ORDER BY m.createdAt DESC")
    List<Message> findByUserId(@Param("userId") Long userId);
}
