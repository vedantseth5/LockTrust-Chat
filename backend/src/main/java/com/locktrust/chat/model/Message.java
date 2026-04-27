package com.locktrust.chat.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

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

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "parentMessage", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ThreadReply> replies = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();
}
