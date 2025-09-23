package com.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.crm.model.Customer;

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
            double current;
            switch (field) {
                case "totalSpend":
                    current = c.getTotalSpend() == null ? 0.0 : c.getTotalSpend();
                    break;
                case "totalVisits":
                    current = c.getTotalVisits() == null ? 0.0 : c.getTotalVisits();
                    break;
                case "inactiveDays":
                    if (c.getLastActiveAt() == null) {
                        current = 999999.0;
                    } else {
                        long days = java.time.Duration.between(c.getLastActiveAt(), java.time.LocalDateTime.now()).toDays();
                        current = (double) days;
                    }
                    break;
                default:
                    current = 0.0;
                    break;
            }
            switch (operator) {
                case ">":
                    return current > value;
                case ">=":
                    return current >= value;
                case "<":
                    return current < value;
                case "<=":
                    return current <= value;
                case "==":
                    return current == value;
                case "!=":
                    return current != value;
                default:
                    return false;
            }
        }
    }
}


