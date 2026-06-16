package com.example.adbye.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OcrResponse {
    private String extractedText;
}