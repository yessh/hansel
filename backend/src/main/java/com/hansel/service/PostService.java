package com.hansel.service;

import com.hansel.domain.Post;
import com.hansel.domain.User;
import com.hansel.dto.PostCreateRequest;
import com.hansel.dto.PostResponse;
import com.hansel.repository.PostRepository;
import com.hansel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private static final int SRID = 4326;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), SRID);

    @Transactional
    public PostResponse create(PostCreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Point location = geometryFactory.createPoint(
                new Coordinate(request.longitude(), request.latitude())
        );
        location.setSRID(SRID);

        Post post = Post.builder()
                .content(request.content())
                .author(user.getNickname())
                .imageUrl(request.imageUrl())
                .location(location)
                .user(user)
                .build();

        return PostResponse.from(postRepository.save(post));
    }

    public List<PostResponse> findNearby(double latitude, double longitude) {
        return postRepository.findNearby(latitude, longitude)
                .stream()
                .map(PostResponse::from)
                .toList();
    }

    public PostResponse findById(Long id) {
        return postRepository.findById(id)
                .map(PostResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public List<PostResponse> findMyPosts(Long userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(PostResponse::from)
                .toList();
    }
}
