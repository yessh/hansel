package com.hansel.service;

import com.hansel.domain.Post;
import com.hansel.dto.PostCreateRequest;
import com.hansel.dto.PostResponse;
import com.hansel.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private static final int SRID = 4326;

    private final PostRepository postRepository;
    // GeometryFactory: PrecisionModel.FLOATING + SRID 4326 (WGS84)
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID);

    @Transactional
    public PostResponse create(PostCreateRequest request) {
        // JTS Point: MakePoint(경도, 위도) — X=longitude, Y=latitude
        Point location = geometryFactory.createPoint(
                new Coordinate(request.longitude(), request.latitude())
        );
        location.setSRID(SRID);

        Post post = Post.builder()
                .content(request.content())
                .author(request.author())
                .imageUrl(request.imageUrl())
                .location(location)
                .build();

        return PostResponse.from(postRepository.save(post));
    }

    public List<PostResponse> findNearby(double latitude, double longitude) {
        return postRepository.findNearby(latitude, longitude)
                .stream()
                .map(PostResponse::from)
                .toList();
    }
}
