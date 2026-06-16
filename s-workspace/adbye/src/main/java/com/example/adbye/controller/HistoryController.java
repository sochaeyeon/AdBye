package com.example.adbye.controller;

import com.example.adbye.dto.HistoryDto;
import com.example.adbye.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "http://localhost:3000")
public class HistoryController {

  private final HistoryService historyService;
 
  public HistoryController(HistoryService historyService) {
    this.historyService = historyService;
  }

  @PostMapping
  public ResponseEntity<HistoryDto.HistoryResponseDto> saveHistory(
      Authentication authentication,
      @RequestBody HistoryDto.HistoryRequestDto requestDto) {
    String username = authentication.getName();
    return ResponseEntity.ok(historyService.saveHistory(username, requestDto));
  }

  @GetMapping
  public ResponseEntity<List<HistoryDto.HistoryResponseDto>> getHistory(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.ok(List.of());
    }
    String username = authentication.getName();
    return ResponseEntity.ok(historyService.getHistoryByUsername(username));
  }
}