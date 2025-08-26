package com.cop.notification.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
	@GetMapping
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<List<Map<String, Object>>> list() {
		return ResponseEntity.ok(List.of());
	}
}