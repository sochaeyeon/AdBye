package com.example.adbye.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.adbye.dto.AnalyzeRequest;
import com.example.adbye.dto.AnalyzeResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FastApiClient {

    private final RestTemplate restTemplate;
    private static final String FASTAPI_URL = "http://localhost:8000/analyze";

    public AnalyzeResponse analyzeReview(AnalyzeRequest request) {
        try {
            return restTemplate.postForObject(FASTAPI_URL, request, AnalyzeResponse.class);
        } catch (Exception e) {
            log.error("FastAPI 통신 실패: {}", e.getMessage());
            throw new RuntimeException("AI 분석 서버와의 통신에 실패했습니다.");
        }
    }
}