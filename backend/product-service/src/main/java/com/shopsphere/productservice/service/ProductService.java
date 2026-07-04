package com.shopsphere.productservice.service;

import com.shopsphere.productservice.dto.request.ProductRequest;
import com.shopsphere.productservice.dto.response.ProductResponse;
import com.shopsphere.productservice.entity.Category;
import com.shopsphere.productservice.entity.Product;
import com.shopsphere.productservice.exception.DuplicateResourceException;
import com.shopsphere.productservice.exception.ResourceNotFoundException;
import com.shopsphere.productservice.repository.CategoryRepository;
import com.shopsphere.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Value("${app.upload.dir:uploaded-images}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8080/api/v1/products/images}")
    private String uploadBaseUrl;

    public Category createCategory(String name, String description) {
        if (categoryRepository.existsByName(name)) {
            throw new DuplicateResourceException("Category with name '" + name + "' already exists");
        }

        Category category = Category.builder()
                .name(name)
                .description(description)
                .build();
        return categoryRepository.save(category);
    }

    @Transactional
    public ProductResponse createProduct(String sellerId, String shopName, ProductRequest request, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        List<String> imageUrls = resolveImageUrls(request);
        String coverImageUrl = imageUrls.isEmpty() ? request.imageUrl() : imageUrls.get(0);

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .skuCode(request.skuCode())
                .sellerId(sellerId)
                .shopName(shopName)
                .category(category)
                .imageUrl(coverImageUrl)
                .imageUrls(imageUrls)
                .build();

        Product savedProduct = productRepository.save(product);
        log.info("Product created with ID: {}", savedProduct.getId());

        return mapToProductResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(String sellerId, String userRole, String productId, ProductRequest request) {
        Product product = productRepository.findById(UUID.fromString(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        assertOwnership(product, sellerId, userRole);

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());

        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            product.setImageUrls(request.imageUrls());
            product.setImageUrl(request.imageUrls().get(0));
        } else if (request.imageUrl() != null && !request.imageUrl().isBlank()) {
            product.setImageUrl(request.imageUrl());
        }

        Product savedProduct = productRepository.save(product);
        log.info("Product {} updated by seller {}", productId, sellerId);

        return mapToProductResponse(savedProduct);
    }

    @Transactional
    public void deleteProduct(String sellerId, String userRole, String productId) {
        Product product = productRepository.findById(UUID.fromString(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        assertOwnership(product, sellerId, userRole);

        productRepository.delete(product);
        log.info("Product {} deleted by seller {}", productId, sellerId);
    }

    private void assertOwnership(Product product, String sellerId, String userRole) {
        boolean isOwner = product.getSellerId().equals(sellerId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to modify this product");
        }
    }

    private List<String> resolveImageUrls(ProductRequest request) {
        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            return new ArrayList<>(request.imageUrls());
        }
        if (request.imageUrl() != null && !request.imageUrl().isBlank()) {
            List<String> single = new ArrayList<>();
            single.add(request.imageUrl());
            return single;
        }
        return new ArrayList<>();
    }

    /**
     * Saves uploaded image files to local disk and returns their publicly
     * reachable URLs. Called from a dedicated upload endpoint BEFORE product
     * create/update — the frontend uploads first, gets URLs back, then
     * includes those URLs in the create/update product request body.
     */
    public List<String> uploadImages(List<MultipartFile> files) {
        List<String> urls = new ArrayList<>();
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
                String extension = "";
                int dotIndex = originalName.lastIndexOf('.');
                if (dotIndex >= 0) extension = originalName.substring(dotIndex);

                String storedFilename = UUID.randomUUID() + extension;
                Path destination = uploadPath.resolve(storedFilename);
                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

                urls.add(uploadBaseUrl + "/" + storedFilename);
                log.info("Saved uploaded image to {}", destination);
            }
        } catch (IOException e) {
            log.error("Failed to save uploaded image(s)", e);
            throw new RuntimeException("Failed to store uploaded image(s): " + e.getMessage());
        }
        return urls;
    }

    public Page<ProductResponse> getProductsByCategory(String categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);

        return productPage.map(this::mapToProductResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(String productId) {
        Product product = productRepository.findById(UUID.fromString(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return mapToProductResponse(product);
    }

    @Transactional(readOnly = true)
    public boolean existsBySkuCode(String skuCode) {
        return productRepository.existsBySkuCode(skuCode);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySkuCode(String skuCode) {
        Product product = productRepository.findBySkuCode(skuCode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with SKU: " + skuCode));
        return mapToProductResponse(product);
    }

    private ProductResponse mapToProductResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getSkuCode(),
                product.getCategory().getName(),
                product.getImageUrl(),
                product.getShopName(),
                product.getImageUrls()
        );
    }

    public Page<Product> searchProducts(String keyword, int page, int size) {
        return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategoryNameContainingIgnoreCase(
                keyword, keyword, keyword, PageRequest.of(page, size)
        );
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<ProductResponse> getProductsBySeller(String sellerId) {
        List<Product> products = productRepository.findBySellerId(sellerId);
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    public BigDecimal getPriceBySku(String skuCode) {
        Product product = productRepository.findBySkuCode(skuCode)
                .orElseThrow(() -> new RuntimeException("Product not found for SKU: " + skuCode));
        return product.getPrice();
    }
}