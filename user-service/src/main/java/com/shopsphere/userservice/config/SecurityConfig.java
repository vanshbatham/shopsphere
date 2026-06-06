package com.shopsphere.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/users/v3/api-docs/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers(
                                "/api/v1/users/register",
                                "/api/v1/users/login",
                                "/api/v1/users/addresses",
                                "/api/v1/users/refresh",
                                "/api/v1/coupons/**",
                                "/api/v1/reviews/**",
                                "/api/v1/users/addresses/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/profile").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/users/profile").permitAll()
                        .requestMatchers("/api/v1/users/me").permitAll()
                        .requestMatchers("/api/v1/users/become-seller").permitAll()
                        .anyRequest().permitAll()
                );
        return http.build();
    }
}