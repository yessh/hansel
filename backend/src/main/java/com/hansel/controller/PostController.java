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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
     * 게시글 작성 (인증 필요)
     */
    @PostMapping
    public ResponseEntity<PostResponse> create(
            @Valid @RequestBody PostCreateRequest request,
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.create(request, userId));
    }

    /**
     * GET /api/posts/nearby?latitude={lat}&longitude={lon}
     * 현재 위치 반경 100m 이내 게시글 최신순 조회 (공개)
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
        return ResponseEntity.ok(postService.findNearby(latitude, longitude));
    }

    /**
     * GET /api/posts/in-bounds?swLat=&swLng=&neLat=&neLng=
     * 현재 지도 뷰포트 내 게시글 최신순 조회 (공개)
     */
    @GetMapping("/in-bounds")
    public ResponseEntity<List<PostResponse>> findInBounds(
            @RequestParam @NotNull
            @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
            @DecimalMax(value = "90.0", message = "위도는 90 이하이어야 합니다.")
            Double swLat,

            @RequestParam @NotNull
            @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
            @DecimalMax(value = "180.0", message = "경도는 180 이하이어야 합니다.")
            Double swLng,

            @RequestParam @NotNull
            @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
            @DecimalMax(value = "90.0", message = "위도는 90 이하이어야 합니다.")
            Double neLat,

            @RequestParam @NotNull
            @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
            @DecimalMax(value = "180.0", message = "경도는 180 이하이어야 합니다.")
            Double neLng
    ) {
        return ResponseEntity.ok(postService.findInBounds(swLat, swLng, neLat, neLng));
    }

    /**
     * GET /api/posts/{id}
     * 게시글 상세 조회 (인증 필요)
     */
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(postService.findById(id));
    }

    /**
     * GET /api/posts/my
     * 내가 작성한 게시글 목록 최신순 조회 (인증 필요)
     */
    @GetMapping("/my")
    public ResponseEntity<List<PostResponse>> findMyPosts(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(postService.findMyPosts(userId));
    }
}
