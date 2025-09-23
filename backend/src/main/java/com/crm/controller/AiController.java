package com.crm.controller;

import com.crm.service.AiService;
import org.springframework.web.bind.annotation.*;
import java.util.*;
// Successfully connected to the AI service
@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiService aiService;
    public AiController(AiService aiService) { this.aiService = aiService; }

    @PostMapping("/suggest-messages")
    public Map<String, Object> suggest(@RequestBody Map<String, Object> body) {
        String objective = Objects.toString(body.get("objective"), "");
        return Map.of("suggestions", aiService.suggestMessages(objective));
    }
}


