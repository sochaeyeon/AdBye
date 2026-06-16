package com.example.adbye.controller;

import com.example.adbye.entity.Inquiry;
import com.example.adbye.service.InquiryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = "*")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    @PostMapping
    public ResponseEntity<Inquiry> createInquiry(@RequestBody Inquiry inquiry) {
        return ResponseEntity.ok(inquiryService.saveInquiry(inquiry));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Inquiry>> getUserInquiries(@PathVariable String username) {
        return ResponseEntity.ok(inquiryService.findByUsername(username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteInquiry(@PathVariable Long id, @RequestParam String username) {
        boolean deleted = inquiryService.deleteInquiry(id, username);
        if (deleted) {
            return ResponseEntity.ok("문의가 삭제되었습니다.");
        } else {
            return ResponseEntity.status(403).body("삭제 권한이 없습니다.");
        }
    }
}