package com.xeno.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xeno.crm.model.Customer;

public class RuleEvaluator {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean matches(Customer customer, String ruleJson) {
        if (ruleJson == null || ruleJson.isBlank()) return true;
        try {
            JsonNode root = objectMapper.readTree(ruleJson);
            return evaluateNode(customer, root);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean evaluateNode(Customer c, JsonNode node) {
        String type = node.path("type").asText();
        if ("group".equalsIgnoreCase(type)) {
            String op = node.path("op").asText("AND");
            boolean result = "AND".equalsIgnoreCase(op);
            for (JsonNode child : node.path("children")) {
                boolean childRes = evaluateNode(c, child);
                if ("AND".equalsIgnoreCase(op)) {
                    result = result && childRes;
                } else {
                    result = result || childRes;
                }
            }
            return result;
        } else { // simple rule
            String field = node.path("field").asText();
            String operator = node.path("operator").asText();
            double value = node.path("value").asDouble();
            double current = switch (field) {
                case "totalSpend" -> c.getTotalSpend() == null ? 0.0 : c.getTotalSpend();
                case "totalVisits" -> c.getTotalVisits() == null ? 0.0 : c.getTotalVisits();
                case "inactiveDays" -> {
                    if (c.getLastActiveAt() == null) yield 999999.0;
                    long days = java.time.Duration.between(c.getLastActiveAt(), java.time.LocalDateTime.now()).toDays();
                    yield (double) days;
                }
                default -> 0.0;
            };
            return switch (operator) {
                case ">" -> current > value;
                case ">=" -> current >= value;
                case "<" -> current < value;
                case "<=" -> current <= value;
                case "==" -> current == value;
                case "!=" -> current != value;
                default -> false;
            };
        }
    }
}


