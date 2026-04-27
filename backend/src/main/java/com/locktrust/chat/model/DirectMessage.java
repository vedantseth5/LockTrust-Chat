package com.locktrust.chat.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "direct_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private DmConversation conversation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "reply_to_id")
    private Long replyToId;

    @Column(name = "reply_to_sender_name")
    private String replyToSenderName;

    @Column(name = "reply_to_content", columnDefinition = "TEXT")
    private String replyToContent;

    @OneToMany(mappedBy = "directMessage", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();

    @Builder.Default
    private Boolean edited = false;

    @Builder.Default
    private Boolean deleted = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
