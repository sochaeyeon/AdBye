package com.example.adbye.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.adbye.dto.AnalyzeRequest;
import com.example.adbye.dto.AnalyzeResponse;
import com.example.adbye.dto.HistoryDto;
import com.example.adbye.dto.OcrResponse;
import com.example.adbye.entity.Reviews;
import com.example.adbye.repository.ReviewsRepository;
import com.example.adbye.service.FastApiClient;
import com.example.adbye.service.HistoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;


@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class ReviewController {

    private final ReviewsRepository reviewsRepository;
    private final FastApiClient fastApiClient;
    private final HistoryService historyService;

    private static final Map<String, String> categoryMap = Map.of(
        "패션잡화", "FashionGrocery",
        "식품건강", "FoodHealth",
        "뷰티", "Beauty",
        "생활주방", "Household/kitchen",
        "유아동", "Childbirth/indolder",
        "문구오피스", "Toy/Stationery",
        "가전디지털", "HomeAppliance/Digital",
        "스포츠레저", "Sports/Leisure"
    );

    @PostMapping("/check")
    public AnalyzeResponse checkReview(@RequestBody Map<String, String> payload, Authentication authentication) {
        String userReview = payload.get("userReview");
        String category = (payload.get("category") != null) ? payload.get("category").trim() : "";
        
        // 1. 카테고리별 광고 데이터 조회
        String dbCategory = categoryMap.getOrDefault(category, "");
        List<Reviews> adReviewsEntities = dbCategory.isEmpty() ? 
                reviewsRepository.findAllByLabel(1) : 
                reviewsRepository.findByCategoryAndLabel(dbCategory, 1);

        // 2. 데이터 매핑
        Map<String, String> cleanedToOriginalMap = adReviewsEntities.stream()
                .collect(Collectors.toMap(Reviews::getCleanedReview, Reviews::getContent, (e, r) -> e));

        // 3. AI 분석 요청
        AnalyzeRequest req = new AnalyzeRequest(userReview, new ArrayList<>(cleanedToOriginalMap.keySet()), dbCategory);
        AnalyzeResponse response = fastApiClient.analyzeReview(req);

        // 4. 원본 리뷰로 치환 및 결과 정리
        String mostSimilarOriginal = cleanedToOriginalMap.getOrDefault(response.getMostSimilarAdReview(), response.getMostSimilarAdReview());
        response.setMostSimilarAdReview(mostSimilarOriginal);

        // 5. 이력 저장
        if (authentication != null && authentication.isAuthenticated()) {
            saveHistory(authentication.getName(), category, response);
        }

        return response;
    }

    private void saveHistory(String username, String category, AnalyzeResponse response) {
        HistoryDto.HistoryRequestDto dto = new HistoryDto.HistoryRequestDto(
                category,
                response.getInputReview(),
                response.getSimilarityScore(),
                response.getMostSimilarAdReview(),
                String.join(", ", response.getAdKeywords()),
                String.join(", ", response.getNonAdKeywords()),
                response.getDecision()
        );
        historyService.saveHistory(username, dto);
    }
    
  @Value("${tesseract.data.path}")
  private String tessdataPath;

  @PostMapping("/ocr")
  public ResponseEntity<OcrResponse> extractTextFromImage(@RequestPart("image") MultipartFile imageFile) throws Exception {
      ITesseract tesseract = new Tesseract();
      tesseract.setDatapath(tessdataPath);
      tesseract.setLanguage("kor+eng");

      Path tempDir = Files.createTempDirectory("ocr-temp");
      Path tempFile = tempDir.resolve(imageFile.getOriginalFilename());
      Files.copy(imageFile.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
      
      // OCR
      String extractedText = tesseract.doOCR(tempFile.toFile());

      Files.delete(tempFile);
      Files.delete(tempDir);

      return ResponseEntity.ok(new OcrResponse(extractedText));
  }
}