package com.hansel.controller;

import com.hansel.dto.CommentCreateRequest;
import com.hansel.dto.CommentResponse;
import com.hansel.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * GET /api/posts/{postId}/comments
     * 댓글 목록 조회 (인증 필요)
     */
    @GetMapping
    public ResponseEntity<List<CommentResponse>> findAll(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.findByPost(postId));
    }

    /**
     * POST /api/posts/{postId}/comments
     * 댓글 작성 (인증 필요)
     */
    @PostMapping
    public ResponseEntity<CommentResponse> create(
            @PathVariable Long postId,
            @Valid @RequestBody CommentCreateRequest request,
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(postId, userId, request));
    }
}
