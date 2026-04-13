package com.locktrust.chat.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reactions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "thread_reply_id", "user_id", "emoji"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thread_reply_id")
    private ThreadReply threadReply;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String emoji;
}
