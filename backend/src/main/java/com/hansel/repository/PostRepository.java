package com.hansel.repository;

import com.hansel.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * 사용자의 현재 위경도 기준 반경 100m 이내 게시글을 최신순으로 조회.
     *
     * ST_DWithin(geography, geography, meters):
     *   - location::geography 로 캐스팅하면 단위가 미터(meter)로 동작 → 정확한 거리 계산
     *   - ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography : 요청 좌표를 동일 타입으로 변환
     *   - 100 = 반경 100m
     *
     * ST_MakePoint(lon, lat): PostGIS 는 (경도, 위도) = (X, Y) 순서
     */
    @Query(value = """
            SELECT *
            FROM post
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                100
            )
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<Post> findNearby(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude
    );

    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}
