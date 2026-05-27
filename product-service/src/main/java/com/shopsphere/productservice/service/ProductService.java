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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

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
    public ProductResponse createProduct(ProductRequest request, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .skuCode(request.skuCode())
                .category(category)
                .imageUrl(request.imageUrl())
                .build();

        Product savedProduct = productRepository.save(product);
        log.info("Product created with ID: {}", savedProduct.getId());
        return new ProductResponse(
                savedProduct.getId(),
                savedProduct.getName(),
                savedProduct.getDescription(),
                savedProduct.getPrice(),
                savedProduct.getSkuCode(),
                category.getName(),
                savedProduct.getImageUrl()
        );
    }

    public Page<ProductResponse> getProductsByCategory(String categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);

        return productPage.map(product -> new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getSkuCode(),
                product.getCategory().getName(),
                product.getImageUrl()
        ));
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
                product.getImageUrl()
        );
    }

    public Page<Product> searchProducts(String keyword, int page, int size) {
        return productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategoryNameContainingIgnoreCase(
                keyword, keyword, keyword, PageRequest.of(page, size)
        );
    }
}