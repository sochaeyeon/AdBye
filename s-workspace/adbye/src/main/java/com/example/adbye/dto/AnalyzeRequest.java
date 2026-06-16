package com.example.adbye.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeRequest {
    private String review;
    private List<String> ad_reviews;
    private String category;
}