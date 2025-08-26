package com.cop.decision.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/decisions")
public class DecisionController {
	@PostMapping
	@PreAuthorize("hasRole('HQ')")
	public ResponseEntity<Map<String, Object>> createDecision(@RequestBody Map<String, Object> body) {
		Map<String, Object> decision = Map.of(
			"id", "dec-" + System.currentTimeMillis(),
			"status", body.getOrDefault("status", "APPROVED"),
			"relatedEventId", body.get("relatedEventId"),
			"createdAt", OffsetDateTime.now().toString()
		);
		return ResponseEntity.ok(decision);
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('HQ','OBSERVER','ANALYST_SOCMINT','ANALYST_SIGINT','ANALYST_HUMINT')")
	public ResponseEntity<List<Map<String, Object>>> list() {
		return ResponseEntity.ok(List.of());
	}
}