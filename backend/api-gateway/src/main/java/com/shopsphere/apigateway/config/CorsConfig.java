package com.shopsphere.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 1. Allow your React frontend
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        // 2. Allow all methods (GET, POST, OPTIONS, etc.)
        config.setAllowedMethods(List.of("*"));

        // 3. Allow all headers (Authorization, Content-Type, etc.)
        config.setAllowedHeaders(List.of("*"));

        // 4. Required for Authorization headers
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this completely open CORS policy to EVERY route in the Gateway
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}