package com.shopsphere.productservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Value("${app.upload.dir:uploaded-images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serves files at e.g. GET /api/v1/products/images/<filename>
        // — deliberately under the existing /api/v1/products prefix so the
        // gateway's current routing rule (whatever it does with that prefix)
        // covers this too, without needing a new gateway route.
        String location = "file:" + System.getProperty("user.dir") + "/" + uploadDir + "/";
        registry.addResourceHandler("/api/v1/products/images/**")
                .addResourceLocations(location);
    }
}