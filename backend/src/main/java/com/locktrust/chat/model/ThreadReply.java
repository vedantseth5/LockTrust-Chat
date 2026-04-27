package com.locktrust.chat.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "thread_replies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThreadReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = false)
    private Message parentMessage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private Boolean edited = false;

    @Builder.Default
    private Boolean deleted = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "threadReply", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();
}
