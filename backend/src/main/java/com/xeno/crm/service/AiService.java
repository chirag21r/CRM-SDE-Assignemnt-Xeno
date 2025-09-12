package com.xeno.crm.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class AiService {
    @Value("${groq.api.key:}")
    private String groqKey;
    @Value("${groq.model.name:llama-3.1-8b-instant}")
    private String groqModel;

    public List<String> suggestMessages(String objective) {
        if (groqKey == null || groqKey.isBlank()) {
            return localSuggest(objective);
        }
        try {
            // Build prompt asking strictly for a JSON array; honor explicit % and audience
            String prompt = ("You are a CRM copywriter. Objective: " + objective +
                    ". If a percent discount is specified, use exactly that percent. If a target audience is mentioned (e.g., students), tailor the tone accordingly. Return ONLY a JSON array with 3 unique short SMS messages (<=80 chars) using {name}. No commentary.")
                    .replace("\n", " ");
            String body = new StringBuilder()
                    .append("{\"model\":\"").append(groqModel).append("\",")
                    .append("\"messages\":[{\"role\":\"user\",\"content\":\"")
                    .append(prompt.replace("\\", "\\\\").replace("\"","\\\""))
                    .append("\"}],\"temperature\":0.9}")
                    .toString();

            var req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Authorization", "Bearer "+groqKey)
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body))
                    .build();
            var client = java.net.http.HttpClient.newHttpClient();
            var res = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
            String json = res.body();

            ObjectMapper om = new ObjectMapper();
            JsonNode root = om.readTree(json);
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content == null) content = "";

            // Normalize: strip code fences and language tags
            content = content.replace("\r", "\n").trim();
            if (content.startsWith("```")) {
                int firstNl = content.indexOf('\n');
                content = firstNl >= 0 ? content.substring(firstNl + 1) : content.substring(3);
                if (content.endsWith("```")) content = content.substring(0, content.length() - 3);
            }
            content = content.trim();

            List<String> lines = new ArrayList<>();
            // Try strict JSON array first
            if (content.startsWith("[") && content.endsWith("]")) {
                try {
                    JsonNode arr = om.readTree(content);
                    if (arr.isArray()) {
                        for (JsonNode n : arr) lines.add(n.asText(""));
                    }
                } catch (Exception ignored) {}
            }
            // Fallback: split lines or bullets
            if (lines.isEmpty()) {
                for (String line : content.split("\n")) {
                    String v = line.trim();
                    if (v.startsWith("-") || v.startsWith("*")) v = v.substring(1).trim();
                    if (v.matches("^[0-9]+[).].*")) v = v.replaceFirst("^[0-9]+[).]\\s*", "");
                    if (!v.isBlank()) lines.add(v);
                }
            }
            // De‑dup and cap at 3
            LinkedHashSet<String> uniq = new LinkedHashSet<>();
            for (String v : lines) {
                String s = v.trim();
                if (!s.isBlank()) uniq.add(s);
                if (uniq.size() >= 3) break;
            }
            if (!uniq.isEmpty()) {
                List<String> raw = new ArrayList<>(uniq);
                return enforceGoalConstraints(objective, raw);
            }
        } catch (Exception ignored) {}

        // Safe fallback with local variety
        return localSuggest(objective);
    }

    private List<String> localSuggest(String objective) {
        String obj = objective == null ? "" : objective.toLowerCase();
        java.util.Random rnd = new java.util.Random(obj.hashCode());

        // Extract explicit discount like "50%" or "flat 50"
        String explicit = null;
        java.util.regex.Matcher m1 = java.util.regex.Pattern.compile("(\\d{1,3})\\s*%", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(obj);
        if (m1.find()) explicit = m1.group(1) + "%";
        if (explicit == null) {
            java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("flat\\s*(\\d{1,3})", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(obj);
            if (m2.find()) explicit = m2.group(1) + "%";
        }

        String[] defaults = new String[]{"8%","10%","12%","15%","18%","20%","25%"};
        String d1 = explicit != null ? explicit : defaults[rnd.nextInt(defaults.length)];
        String d2 = explicit != null ? explicit : defaults[rnd.nextInt(defaults.length)];
        String d3 = explicit != null ? explicit : defaults[rnd.nextInt(defaults.length)];

        boolean students = obj.contains("student");
        boolean inactive = obj.contains("inactive") || obj.contains("winback") || obj.contains("come back");
        boolean highSpender = obj.contains("spend") || obj.contains("premium") || obj.contains("loyal");
        boolean newUsers = obj.contains("new") || obj.contains("first") || obj.contains("signup");

        List<String> out = new ArrayList<>();
        if (students) {
            out.add("Student offer: "+d1+" off for you, {name}. Verify and save now.");
            out.add("Hey {name}, campus special—take "+d2+" off today.");
            out.add("{name}, unlock your student deal: "+d3+" off. Limited time.");
        } else if (inactive) {
            out.add("It’s been a while, {name}. Enjoy "+d1+" off—come back today!");
            out.add("{name}, we saved you "+d2+" off your next order. Tap to return.");
            out.add("Miss you, {name}! Grab "+d3+" off and rediscover your favorites.");
        } else if (highSpender) {
            out.add("{name}, a thank‑you treat: "+d1+" off for our loyal customers.");
            out.add("VIP perk unlocked, {name}: extra "+d2+" off this week only.");
            out.add("Premium pick for you, {name}—take "+d3+" off today.");
        } else if (newUsers) {
            out.add("Welcome offer for you, {name}: "+d1+" off your first order.");
            out.add("Start with a win, {name}—get "+d2+" off at checkout.");
            out.add("Hello {name}! Claim "+d3+" off and try us now.");
        } else {
            out.add("Hi {name}, unlock "+d1+" off today—limited time.");
            out.add("{name}, exclusive "+d2+" savings just for you. Shop now.");
            out.add("Limited time: take "+d3+" off on your next purchase, {name}!");
        }
        return enforceGoalConstraints(objective, out);
    }

    private List<String> enforceGoalConstraints(String objective, List<String> messages) {
        String obj = objective == null ? "" : objective.toLowerCase();
        // Detect explicit percent (e.g., 50% or flat 50)
        String explicit = null;
        java.util.regex.Matcher m1 = java.util.regex.Pattern.compile("(\\d{1,3})\\s*%", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(obj);
        if (m1.find()) explicit = m1.group(1) + "%";
        if (explicit == null) {
            java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("flat\\s*(\\d{1,3})", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(obj);
            if (m2.find()) explicit = m2.group(1) + "%";
        }
        boolean students = obj.contains("student");

        List<String> adjusted = new ArrayList<>();
        for (String msg : messages) {
            String s = msg;
            if (explicit != null) {
                // Replace any existing percent with explicit; if none, inject explicit at first suitable spot
                if (s.matches(".*\\d{1,3}\\s*%.*")) {
                    s = s.replaceFirst("\\d{1,3}\\s*%", explicit);
                } else {
                    // Try to insert before 'off' or append at end
                    if (s.toLowerCase().contains(" off")) {
                        s = s.replaceFirst("(?i)(\\s)off", " "+explicit+" off");
                    } else {
                        s = s.endsWith("!") ? s.substring(0, s.length()-1) + " ("+explicit+" off)!" : s + " ("+explicit+" off)";
                    }
                }
            }
            if (students && !s.toLowerCase().contains("student") && !s.toLowerCase().contains("campus") && !s.toLowerCase().contains("college")) {
                // Preface with a short student cue if space allows
                String prefix = "Student offer: ";
                if (!s.toLowerCase().startsWith("student")) s = prefix + s;
            }
            adjusted.add(s);
            if (adjusted.size() >= 3) break;
        }
        return adjusted.isEmpty() ? messages : adjusted;
    }
}


