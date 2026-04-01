package com.hansel.service;

import com.hansel.domain.Post;
import com.hansel.domain.PostLike;
import com.hansel.domain.User;
import com.hansel.dto.LikeStatusResponse;
import com.hansel.repository.PostLikeRepository;
import com.hansel.repository.PostRepository;
import com.hansel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final PostLikeRepository postLikeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public LikeStatusResponse getStatus(Long postId, Long userId) {
        long count = postLikeRepository.countByPostId(postId);
        boolean liked = postLikeRepository.existsByPostIdAndUserId(postId, userId);
        return new LikeStatusResponse(count, liked);
    }

    @Transactional
    public LikeStatusResponse toggle(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        postLikeRepository.findByPostIdAndUserId(postId, userId)
                .ifPresentOrElse(
                        postLikeRepository::delete,
                        () -> postLikeRepository.save(new PostLike(post, user))
                );

        long count = postLikeRepository.countByPostId(postId);
        boolean liked = postLikeRepository.existsByPostIdAndUserId(postId, userId);
        return new LikeStatusResponse(count, liked);
    }
}
