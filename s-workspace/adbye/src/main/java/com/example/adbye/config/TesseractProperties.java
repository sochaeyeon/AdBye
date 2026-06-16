package com.example.adbye.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "tesseract")
@Getter
@Setter
public class TesseractProperties {
    private Data data = new Data();

    @Getter
    @Setter
    public static class Data {
        private String path;
    }
}