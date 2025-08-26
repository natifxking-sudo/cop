package com.cop.report.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

	@PostMapping
	@PreAuthorize("hasAnyRole('ANALYST_SOCMINT','ANALYST_SIGINT','ANALYST_HUMINT','HQ')")
	public ResponseEntity<?> createReport(@RequestBody Map<String, Object> payload) {
		// TODO: persist via JPA
		return ResponseEntity.ok(payload);
	}

	@GetMapping
	@PreAuthorize("hasAnyRole('HQ','ANALYST_SOCMINT','ANALYST_SIGINT','ANALYST_HUMINT','OBSERVER')")
	public ResponseEntity<List<Map<String, Object>>> listReports() {
		return ResponseEntity.ok(List.of());
	}
}