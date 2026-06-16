package com.example.adbye.service;

import com.example.adbye.entity.Inquiry;
import com.example.adbye.repository.InquiryRepository;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InquiryService {
    private final InquiryRepository inquiryRepository;

    public Inquiry saveInquiry(Inquiry inquiry) {
        return inquiryRepository.save(inquiry);
    }

    public List<Inquiry> findAll() {
        return inquiryRepository.findAll();
    }

    public List<Inquiry> findByUsername(String username) {
        return inquiryRepository.findByUsername(username);
    }

    public Inquiry answerInquiry(Long id, String answer) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의가 존재하지 않습니다."));
        inquiry.setAnswer(answer);
        inquiry.setAnsweredAt(LocalDateTime.now());
        return inquiryRepository.save(inquiry);
    }
    
    public boolean deleteInquiry(Long id, String username) {
        return inquiryRepository.findById(id)
                .filter(inq -> inq.getUsername().equals(username))
                .map(inq -> {
                    inquiryRepository.delete(inq);
                    return true;
                }).orElse(false);
    }

}
