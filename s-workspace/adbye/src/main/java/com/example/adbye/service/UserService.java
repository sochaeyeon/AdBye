package com.example.adbye.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.adbye.dto.AuthRequest;
import com.example.adbye.entity.User;
import com.example.adbye.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void registerUser(AuthRequest authRequest) {
        Optional<User> existingUser = userRepository.findByUsername(authRequest.getUsername());
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        if (userRepository.existsByEmail(authRequest.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User newUser = new User();
        newUser.setUsername(authRequest.getUsername());
        newUser.setPassword(passwordEncoder.encode(authRequest.getPassword()));
        newUser.setEmail(authRequest.getEmail());
        newUser.setRole("ROLE_USER");
        newUser.setEnabled(true);
        userRepository.save(newUser);
    }

    public String loginUser(String username, String password) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 잘못되었습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 잘못되었습니다.");
        }
        
        if (!user.getEnabled()) {
        	throw new IllegalArgumentException("비활성화된 계정입니다. 관리자에게 문의하세요.");
        }

        return jwtTokenProvider.createToken(user.getUsername(), user.getRole());
    }
    
    public String getUserRole(String username) {
        return userRepository.findByUsername(username)
                             .map(User::getRole)
                             .orElse("ROLE_USER");
    }
    
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUserById(Long id) {
        userRepository.deleteById(id);
    }
    
}