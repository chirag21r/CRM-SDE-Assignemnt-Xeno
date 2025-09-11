package com.xeno.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiService {
    @Value("${OPENAI_API_KEY:}")
    private String openaiKey;

    public List<String> suggestMessages(String objective) {
        // Minimal offline fallback to avoid external dependency if key not set
        if (openaiKey == null || openaiKey.isBlank()) {
            return List.of(
                "Hi {name}, we miss you! Enjoy 10% off on your next order.",
                "{name}, a special 15% comeback offer is waiting for you.",
                "It’s been a while, {name}! Grab 12% off and treat yourself."
            );
        }
        // TODO: If needed, call OpenAI API using WebClient. For now, keep fallback.
        return List.of(
            "Hi {name}, unlock 10% off today!",
            "{name}, exclusive 12% discount just for you.",
            "Limited time: 15% off on your next purchase, {name}!"
        );
    }
}


