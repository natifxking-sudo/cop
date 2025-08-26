package com.cop.entity;

import com.cop.enums.ClearanceLevel;
import com.cop.enums.IntelligenceType;
import com.cop.enums.ReportStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.locationtech.jts.geom.Point;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "intelligence_reports")
@EntityListeners(AuditingEntityListener.class)
public class IntelligenceReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IntelligenceType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClearanceLevel clearanceLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime eventTime;

    @Column(nullable = false)
    private Double confidenceScore = 0.5;

    @ElementCollection
    @CollectionTable(name = "report_metadata", joinColumns = @JoinColumn(name = "report_id"))
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value")
    private Map<String, String> metadata = new HashMap<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column
    private LocalDateTime reviewedAt;

    @Column
    private String reviewComments;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<ReportAttachment> attachments = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructors
    public IntelligenceReport() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public IntelligenceType getType() { return type; }
    public void setType(IntelligenceType type) { this.type = type; }

    public ClearanceLevel getClearanceLevel() { return clearanceLevel; }
    public void setClearanceLevel(ClearanceLevel clearanceLevel) { this.clearanceLevel = clearanceLevel; }

    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }

    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }

    public LocalDateTime getEventTime() { return eventTime; }
    public void setEventTime(LocalDateTime eventTime) { this.eventTime = eventTime; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewComments() { return reviewComments; }
    public void setReviewComments(String reviewComments) { this.reviewComments = reviewComments; }

    public Set<ReportAttachment> getAttachments() { return attachments; }
    public void setAttachments(Set<ReportAttachment> attachments) { this.attachments = attachments; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
