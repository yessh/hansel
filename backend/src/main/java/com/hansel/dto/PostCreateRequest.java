package com.hansel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PostCreateRequest(

        @NotBlank(message = "내용을 입력해주세요.")
        String content,

        @NotBlank(message = "작성자를 입력해주세요.")
        String author,

        String imageUrl,

        @NotNull(message = "위도를 입력해주세요.")
        Double latitude,

        @NotNull(message = "경도를 입력해주세요.")
        Double longitude
) {}
