package com.shopsphere.notificationservice.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationListener {

    // This method automatically triggers whenever a message lands in "notificationTopic"
    @KafkaListener(topics = "notificationTopic")
    public void handleNotification(String message) {
        // For now, simulating the email dispatch in the console.

        log.info("========================================");
        log.info("📧 EMAIL DISPATCHED!");
        log.info("Message Received from Kafka: {}", message);
        log.info("========================================");
    }
}