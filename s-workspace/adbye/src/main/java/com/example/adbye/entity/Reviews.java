package com.example.adbye.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reviews {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @Column(name = "id")
    private Long id;

    @Column(length = 512)
    private String category;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "product_name", length = 2048)
    private String productName;

    @Lob
    @Column(name = "cleaned_review", columnDefinition = "LONGTEXT")
    private String cleanedReview;

    private Integer label;
}
