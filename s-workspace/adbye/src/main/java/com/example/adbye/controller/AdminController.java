package com.example.adbye.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.adbye.dto.AnswerRequest;
import com.example.adbye.dto.InquiryResponse;
import com.example.adbye.dto.MessageResponse;
import com.example.adbye.dto.UserResponse;
import com.example.adbye.entity.Inquiry;
import com.example.adbye.entity.User;
import com.example.adbye.service.InquiryService;
import com.example.adbye.service.UserService;

@RestController
@RequestMapping("/admin")
public class AdminController {
	
    private final UserService userService;
    private final InquiryService inquiryService;
	
    public AdminController(UserService userService, InquiryService inquiryService) {
        this.userService = userService;
        this.inquiryService = inquiryService;
    }

    // 사용자 조회
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userService.findAllUsers();
        List<UserResponse> dtoList = users.stream()
            .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    // 사용자 삭제
    @DeleteMapping("/users/{id}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUserById(id);
        return ResponseEntity.ok(new MessageResponse("User with ID " + id + " has been deleted."));
    }

    // 문의 조회
    @GetMapping("/inquiries")
    public ResponseEntity<List<InquiryResponse>> getAllInquiries() {
        List<Inquiry> inquiries = inquiryService.findAll(); 

        List<InquiryResponse> dtoList = inquiries.stream()
                .map(inq -> new InquiryResponse(
                    inq.getId(),
                    inq.getUsername(),
                    inq.getTitle(),
                    inq.getContent(),
                    inq.getAnswer(),
                    inq.getCreatedAt(),
                    inq.getAnsweredAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    // 문의 답변
    @PutMapping("/inquiries/{id}/answer")
    public ResponseEntity<InquiryResponse> answerInquiry(
            @PathVariable Long id,
            @RequestBody AnswerRequest request
    ) {
        Inquiry inq = inquiryService.answerInquiry(id, request.getAnswer());
        
        InquiryResponse response = new InquiryResponse(
            inq.getId(), inq.getUsername(), inq.getTitle(), 
            inq.getContent(), inq.getAnswer(), 
            inq.getCreatedAt(), inq.getAnsweredAt()
        );
        
        return ResponseEntity.ok(response);
    }
}