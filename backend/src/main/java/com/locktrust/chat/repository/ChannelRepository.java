package com.locktrust.chat.repository;

import com.locktrust.chat.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChannelRepository extends JpaRepository<Channel, Long> {
    Optional<Channel> findByName(String name);
    boolean existsByName(String name);

    @Query("SELECT DISTINCT c FROM Channel c LEFT JOIN c.members m WHERE c.isPrivate = false OR m.id = :userId")
    List<Channel> findVisibleChannels(@Param("userId") Long userId);

    @Query("SELECT c FROM Channel c JOIN c.members m WHERE m.id = :userId")
    List<Channel> findChannelsByMemberId(@Param("userId") Long userId);

    @Query("SELECT c FROM Channel c WHERE c.isPrivate = false AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Channel> searchChannels(@Param("q") String query);
}
