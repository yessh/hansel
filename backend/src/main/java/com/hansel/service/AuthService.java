package com.hansel.service;

import com.hansel.domain.RefreshToken;
import com.hansel.domain.User;
import com.hansel.dto.AuthResponse;
import com.hansel.dto.KakaoUserInfo;
import com.hansel.repository.RefreshTokenRepository;
import com.hansel.repository.UserRepository;
import com.hansel.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final KakaoOAuthService kakaoOAuthService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;

    public AuthResponse kakaoLogin(String code) {
        KakaoUserInfo info = kakaoOAuthService.fetchUserInfo(code);

        String nickname = info.kakaoAccount() != null && info.kakaoAccount().profile() != null
                ? info.kakaoAccount().profile().nickname() : "사용자";
        String profileImageUrl = info.kakaoAccount() != null && info.kakaoAccount().profile() != null
                ? info.kakaoAccount().profile().profileImageUrl() : null;

        User user = userRepository.findByKakaoId(info.id())
                .map(u -> {
                    u.updateProfile(nickname, profileImageUrl);
                    return u;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .kakaoId(info.id())
                        .nickname(nickname)
                        .profileImageUrl(profileImageUrl)
                        .build()));

        return issueTokens(user);
    }

    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken stored = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 refresh token"));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token 만료");
        }

        return issueTokens(stored.getUser());
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserDto getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return new AuthResponse.UserDto(user.getId(), user.getNickname(), user.getProfileImageUrl());
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtProvider.generateAccessToken(user.getId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());
        LocalDateTime expiry = LocalDateTime.now().plus(7, ChronoUnit.DAYS);

        refreshTokenRepository.findByUser(user)
                .ifPresentOrElse(
                        rt -> rt.rotate(refreshToken, expiry),
                        () -> refreshTokenRepository.save(RefreshToken.builder()
                                .user(user).token(refreshToken).expiresAt(expiry).build())
                );

        return new AuthResponse(accessToken, refreshToken,
                new AuthResponse.UserDto(user.getId(), user.getNickname(), user.getProfileImageUrl()));
    }
}
