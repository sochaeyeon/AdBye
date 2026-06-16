package com.example.adbye.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.adbye.dto.AuthRequest;
import com.example.adbye.dto.AuthResponse;
import com.example.adbye.dto.MessageResponse;
import com.example.adbye.service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@RequestBody AuthRequest request) {
        userService.registerUser(request);
        return ResponseEntity.ok(new MessageResponse("회원가입 성공"));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        String token = userService.loginUser(request.getUsername(), request.getPassword());
        String role = userService.getUserRole(request.getUsername());

        return ResponseEntity.ok(new AuthResponse(token, role));
    }

    @GetMapping("/role")
    public ResponseEntity<Map<String, String>> getUserRole(Authentication authentication) {
        Map<String, String> response = new HashMap<>();

        if (authentication == null || !authentication.isAuthenticated()) {
            response.put("role", "GUEST");
            return ResponseEntity.ok(response);
        }

        String role = authentication.getAuthorities()
                                    .iterator()
                                    .next()
                                    .getAuthority();
        System.out.println("role check: " + role);

        response.put("role", role);
        return ResponseEntity.ok(response);
    }
}
