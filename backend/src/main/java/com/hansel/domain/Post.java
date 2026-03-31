package com.hansel.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private String author;

    @Column(name = "image_url")
    private String imageUrl;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * PostGIS Geometry(Point, 4326) — 경도(x), 위도(y) 순서로 저장.
     * SRID 4326 = WGS 84 (GPS 표준 좌표계)
     */
    @Column(nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @Builder
    public Post(String content, String author, String imageUrl, Point location) {
        this.content = content;
        this.author = author;
        this.imageUrl = imageUrl;
        this.location = location;
    }
}
