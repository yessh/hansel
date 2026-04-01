package com.hansel.dto;

import com.hansel.domain.Post;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        Long userId,
        String content,
        String author,
        String imageUrl,
        LocalDateTime createdAt,
        double latitude,
        double longitude
) {
    public static PostResponse from(Post post) {
        return new PostResponse(
                post.getId(),
                post.getUserId(),
                post.getContent(),
                post.getAuthor(),
                post.getImageUrl(),
                post.getCreatedAt(),
                post.getLocation().getY(),  // JTS: Y = 위도(latitude)
                post.getLocation().getX()   // JTS: X = 경도(longitude)
        );
    }
}
