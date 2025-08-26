package com.cop.file.api;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.rowset.SqlRowSet;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {
	private final MinioClient minioClient;
	private final JdbcTemplate jdbcTemplate;
	private final String bucket;

	public FileController(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
		this.minioClient = MinioClient.builder()
			.endpoint(System.getenv().getOrDefault("MINIO_ENDPOINT", "http://minio:9000"))
			.credentials(System.getenv().getOrDefault("MINIO_ACCESS_KEY", ""), System.getenv().getOrDefault("MINIO_SECRET_KEY", ""))
			.build();
		this.bucket = System.getenv().getOrDefault("MINIO_BUCKET", "cop-files");
	}

	@PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
	                                @RequestParam(value = "reportId", required = false) String reportId,
	                                @RequestParam(value = "eventId", required = false) String eventId,
	                                @RequestParam(value = "classification", required = false, defaultValue = "UNCLASSIFIED") String classification) throws Exception {
		String id = UUID.randomUUID().toString();
		String ext = file.getOriginalFilename() != null && file.getOriginalFilename().contains(".") ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.')) : "";
		String objectName = "cop-files/" + id + ext;
		byte[] bytes = file.getBytes();
		String checksum = DigestUtils.sha256Hex(bytes);

		minioClient.putObject(PutObjectArgs.builder()
			.bucket(bucket)
			.object(objectName)
			.contentType(file.getContentType())
			.stream(new ByteArrayInputStream(bytes), bytes.length, -1)
			.build());

		String s3Url = System.getenv().getOrDefault("MINIO_ENDPOINT", "http://minio:9000") + "/" + bucket + "/" + objectName;

		jdbcTemplate.update("INSERT INTO files (id, filename, original_name, mime_type, size, classification, uploaded_by, uploaded_at, report_id, event_id, tags, checksum, s3_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
				id, id + ext, file.getOriginalFilename(), file.getContentType(), file.getSize(), classification, null, OffsetDateTime.now(), reportId, eventId, "[]", checksum, s3Url);

		Map<String, Object> resp = new HashMap<>();
		resp.put("id", id);
		resp.put("filename", id + ext);
		resp.put("originalName", file.getOriginalFilename());
		resp.put("mimeType", file.getContentType());
		resp.put("size", file.getSize());
		resp.put("classification", classification);
		resp.put("checksum", checksum);
		resp.put("s3Url", s3Url);
		return ResponseEntity.ok(resp);
	}

	@GetMapping("/{id}")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<byte[]> download(@PathVariable("id") String id) throws Exception {
		SqlRowSet rs = jdbcTemplate.queryForRowSet("SELECT * FROM files WHERE id = ?", id);
		if (!rs.next()) return ResponseEntity.notFound().build();
		String filename = rs.getString("filename");
		String mime = rs.getString("mime_type");
		String objectName = "cop-files/" + filename;
		byte[] content = minioClient.getObject(GetObjectArgs.builder().bucket(bucket).object(objectName).build()).readAllBytes();
		return ResponseEntity.ok()
			.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + rs.getString("original_name") + "\"")
			.contentType(MediaType.parseMediaType(mime))
			.body(content);
	}

	@GetMapping("/{id}/metadata")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<?> metadata(@PathVariable("id") String id) {
		SqlRowSet rs = jdbcTemplate.queryForRowSet("SELECT * FROM files WHERE id = ?", id);
		if (!rs.next()) return ResponseEntity.notFound().build();
		Map<String, Object> meta = new HashMap<>();
		meta.put("id", rs.getString("id"));
		meta.put("filename", rs.getString("filename"));
		meta.put("originalName", rs.getString("original_name"));
		meta.put("mimeType", rs.getString("mime_type"));
		meta.put("size", rs.getLong("size"));
		meta.put("classification", rs.getString("classification"));
		meta.put("uploadedBy", rs.getString("uploaded_by"));
		meta.put("uploadedAt", rs.getString("uploaded_at"));
		meta.put("reportId", rs.getString("report_id"));
		meta.put("eventId", rs.getString("event_id"));
		meta.put("tags", rs.getString("tags"));
		meta.put("checksum", rs.getString("checksum"));
		return ResponseEntity.ok(meta);
	}
}