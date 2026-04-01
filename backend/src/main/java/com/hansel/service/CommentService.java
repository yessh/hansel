package com.hansel.service;

import com.hansel.domain.Comment;
import com.hansel.domain.Post;
import com.hansel.domain.User;
import com.hansel.dto.CommentCreateRequest;
import com.hansel.dto.CommentResponse;
import com.hansel.repository.CommentRepository;
import com.hansel.repository.PostRepository;
import com.hansel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public List<CommentResponse> findByPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse create(Long postId, Long userId, CommentCreateRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Comment comment = new Comment(post, user, user.getNickname(), request.content());
        return CommentResponse.from(commentRepository.save(comment));
    }
}
