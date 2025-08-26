package com.cop.fusion.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fusion")
public class FusionController {
	@PostMapping
	@PreAuthorize("hasAnyRole('HQ','ANALYST_SOCMINT','ANALYST_SIGINT','ANALYST_HUMINT')")
	public ResponseEntity<Map<String, Object>> fuse(@RequestBody Map<String, Object> body) {
		List<String> reportIds = (List<String>) body.getOrDefault("reportIds", List.of());
		Map<String, Object> fused = Map.of(
			"id", "evt-" + System.currentTimeMillis(),
			"title", "Fused Event",
			"confidenceScore", 0.75,
			"sourceReports", reportIds,
			"createdAt", OffsetDateTime.now().toString()
		);
		return ResponseEntity.ok(fused);
	}
}