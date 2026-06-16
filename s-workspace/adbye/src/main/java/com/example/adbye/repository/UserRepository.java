package com.example.adbye.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.adbye.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameAndEmail(String username, String email);

    boolean existsByEmail(String email);
}