package com.hansel.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserDto user
) {
    public record UserDto(Long id, String nickname, String profileImageUrl) {}
}
