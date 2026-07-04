package com.shopsphere.inventoryservice.service;

import com.shopsphere.inventoryservice.client.ProductClient;
import com.shopsphere.inventoryservice.dto.request.InventoryRequest;
import com.shopsphere.inventoryservice.dto.response.InventoryResponse;
import com.shopsphere.inventoryservice.entity.Inventory;
import com.shopsphere.inventoryservice.exception.BadRequestException;
import com.shopsphere.inventoryservice.exception.ResourceNotFoundException;
import com.shopsphere.inventoryservice.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductClient productClient;

    // add stock to inventory (admin action, no locks needed since it's just increasing available quantity)
    @Transactional
    public void addStock(String skuCode, Integer quantity) {
        log.info("Admin attempting to add {} units for SKU: {}", quantity, skuCode);

        // check if product exists in Product Catalog before adding inventory
        Boolean productExists = productClient.checkProductExists(skuCode);

        if (Boolean.FALSE.equals(productExists)) {
            log.error("Failed to add inventory: SKU {} does not exist in Product Catalog", skuCode);
            throw new BadRequestException("Cannot add inventory for a non-existent product SKU: " + skuCode);
        }

        // proceed with normal Inventory saving logic...
        Inventory inventory = inventoryRepository.findBySkuCode(skuCode)
                .orElse(Inventory.builder()
                        .skuCode(skuCode)
                        .availableQuantity(0)
                        .reservedQuantity(0)
                        .build());

        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
        inventoryRepository.save(inventory);

        log.info("Successfully added stock. New available quantity for SKU {}: {}", skuCode, inventory.getAvailableQuantity());
    }

    // check stock levels (can be called frequently by the frontend, so we use a read-only transaction without locks for better performance)
    @Transactional(readOnly = true)
    public InventoryResponse checkStock(String skuCode) {
        return inventoryRepository.findBySkuCode(skuCode)
                .map(i -> new InventoryResponse(i.getSkuCode(), i.getAvailableQuantity(),
                        i.getReservedQuantity(), i.getAvailableQuantity() > 0))
                .orElse(new InventoryResponse(skuCode, 0, 0, false));
    }

    // reserve stock for a checkout session (critical section, must use locks to prevent overselling)
    @Transactional
    public boolean reserveStock(InventoryRequest request) {
        log.info("Attempting to reserve {} units for SKU: {}", request.quantity(), request.skuCode());

        // acquire database Lock
        Inventory inventory = inventoryRepository.findBySkuCodeForUpdate(request.skuCode())
                .orElseThrow(() -> new ResourceNotFoundException("SKU not found"));

        // validate availability
        if (inventory.getAvailableQuantity() < request.quantity()) {
            log.warn("Insufficient stock for SKU: {}", request.skuCode());
            return false;
        }

        // move from available to reserved
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() - request.quantity());
        inventory.setReservedQuantity(inventory.getReservedQuantity() + request.quantity());

        inventoryRepository.save(inventory);
        log.info("Successfully reserved {} units for SKU: {}", request.quantity(), request.skuCode());
        return true;
        // transaction commits, database lock is released here
    }

    // release stock back to available (called when payment fails or cart is abandoned, must also use locks to ensure consistency)
    @Transactional
    public void releaseStock(InventoryRequest request) {
        Inventory inventory = inventoryRepository.findBySkuCodeForUpdate(request.skuCode())
                .orElseThrow(() -> new ResourceNotFoundException("SKU not found"));

        // move from reserved back to Available (Payment Failed/Cart Abandoned)
        inventory.setReservedQuantity(inventory.getReservedQuantity() - request.quantity());
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + request.quantity());

        inventoryRepository.save(inventory);
        log.info("Released {} units for SKU: {}", request.quantity(), request.skuCode());
    }

    // deduct stock permanently (called when payment succeeds, must also use locks to ensure consistency)
    @Transactional
    public void deductStock(InventoryRequest request) {
        Inventory inventory = inventoryRepository.findBySkuCodeForUpdate(request.skuCode())
                .orElseThrow(() -> new ResourceNotFoundException("SKU not found"));

        // permanently remove from reserved (Payment Succeeded)
        inventory.setReservedQuantity(inventory.getReservedQuantity() - request.quantity());
        // available stays the same (we already subtracted it during reservation)

        inventoryRepository.save(inventory);
        log.info("Permanently deducted {} units for SKU: {}", request.quantity(), request.skuCode());
    }

    @Transactional
    public void deductReservedStock(Map<String, Integer> skuQuantities) {
        for (Map.Entry<String, Integer> entry : skuQuantities.entrySet()) {
            String skuCode = entry.getKey();
            Integer quantityToDeduct = entry.getValue();

            Inventory inventory = inventoryRepository.findBySkuCode(skuCode)
                    .orElseThrow(() -> new ResourceNotFoundException("SKU not found: " + skuCode));

            // Commit Phase: Simply remove it from reserved. It is gone forever.
            inventory.setReservedQuantity(inventory.getReservedQuantity() - quantityToDeduct);
            inventoryRepository.save(inventory);

            log.info("Stock permanently deducted for SKU: {}, Quantity: {}", skuCode, quantityToDeduct);
        }
    }

    @Transactional
    public void releaseReservedStock(Map<String, Integer> skuQuantities) {
        for (Map.Entry<String, Integer> entry : skuQuantities.entrySet()) {
            String skuCode = entry.getKey();
            Integer quantityToRelease = entry.getValue();

            Inventory inventory = inventoryRepository.findBySkuCode(skuCode)
                    .orElseThrow(() -> new ResourceNotFoundException("SKU not found: " + skuCode));

            // Compensating Phase: Remove from reserved, ADD back to available
            inventory.setReservedQuantity(inventory.getReservedQuantity() - quantityToRelease);
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantityToRelease);
            inventoryRepository.save(inventory);

            log.info("Stock released back to available for SKU: {}, Quantity: {}", skuCode, quantityToRelease);
        }
    }
}