package com.hansel.controller;

import com.hansel.dto.PostCreateRequest;
import com.hansel.dto.PostResponse;
import com.hansel.service.PostService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Validated
public class PostController {

    private final PostService postService;

    /**
     * POST /api/posts
     * 게시글 작성 (위치 정보 포함)
     */
    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostCreateRequest request) {
        PostResponse response = postService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/posts/nearby?latitude={lat}&longitude={lon}
     * 현재 위치 반경 100m 이내 게시글 최신순 조회
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<PostResponse>> findNearby(
            @RequestParam @NotNull
            @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
            @DecimalMax(value = "90.0", message = "위도는 90 이하이어야 합니다.")
            Double latitude,

            @RequestParam @NotNull
            @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
            @DecimalMax(value = "180.0", message = "경도는 180 이하이어야 합니다.")
            Double longitude
    ) {
        List<PostResponse> posts = postService.findNearby(latitude, longitude);
        return ResponseEntity.ok(posts);
    }
}
