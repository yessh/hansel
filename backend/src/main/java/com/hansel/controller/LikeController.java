package com.hansel.controller;

import com.hansel.dto.LikeStatusResponse;
import com.hansel.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    /**
     * GET /api/posts/{postId}/likes
     * 좋아요 수 + 내가 눌렀는지 여부 조회 (인증 필요)
     */
    @GetMapping
    public ResponseEntity<LikeStatusResponse> getStatus(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(likeService.getStatus(postId, userId));
    }

    /**
     * POST /api/posts/{postId}/likes
     * 좋아요 토글 (인증 필요)
     */
    @PostMapping
    public ResponseEntity<LikeStatusResponse> toggle(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(likeService.toggle(postId, userId));
    }
}
