package com.cop.map.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/map")
public class MapController {
	@GetMapping("/events")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<List<Map<String, Object>>> events() {
		return ResponseEntity.ok(List.of());
	}
}