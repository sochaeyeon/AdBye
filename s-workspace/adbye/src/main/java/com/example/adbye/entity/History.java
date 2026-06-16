package com.example.adbye.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import com.example.adbye.dto.HistoryDto.HistoryRequestDto;
import com.example.adbye.dto.HistoryDto.HistoryResponseDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "history")
public class History {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "history_id")
  private Long historyId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
  private User user;

  @Column(nullable = false)
  private String category;

  @Lob
  @Column(name = "input_review", nullable = false, columnDefinition = "TEXT")
  private String inputReview;

  @Column(name = "similarity_score")
  private Double similarityScore;

  @Lob
  @Column(name = "most_similar_review", columnDefinition = "TEXT")
  private String mostSimilarReview;

  @Column(name = "ad_keywords", length = 2048)
  private String adKeywords;

  @Column(name = "non_ad_keywords", length = 2048)
  private String nonAdKeywords;

  private String judgment;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public static History from(User user, HistoryRequestDto requestDto) {
    return History.builder()
        .user(user)
        .category(requestDto.getCategory())
        .inputReview(requestDto.getInputReview())
        .similarityScore(requestDto.getSimilarityScore())
        .mostSimilarReview(requestDto.getMostSimilarReview())
        .adKeywords(requestDto.getAdKeywords())
        .nonAdKeywords(requestDto.getNonAdKeywords())
        .judgment(requestDto.getJudgment())
        .build();
  }

  public HistoryResponseDto toResponseDto() {
    return com.example.adbye.dto.HistoryDto.HistoryResponseDto.builder()
        .historyId(this.historyId)
        .category(this.category)
        .inputReview(this.inputReview)
        .similarityScore(this.similarityScore)
        .mostSimilarReview(this.mostSimilarReview)
        .adKeywords(this.adKeywords)
        .nonAdKeywords(this.nonAdKeywords)
        .judgment(this.judgment)
        .createdAt(this.createdAt)
        .build();
  }
}