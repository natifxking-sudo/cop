package com.cop.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "events")
public class Event extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String type;
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "confidence_score")
    private Double confidenceScore;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "classification_level")
    private ClassificationLevel classificationLevel;
    
    @Enumerated(EnumType.STRING)
    private EventStatus status;
    
    @ManyToMany
    @JoinTable(
        name = "event_reports",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "report_id")
    )
    private Set<IntelligenceReport> sourceReports;
    
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    private List<Decision> decisions;
    
    @Column(name = "fusion_metadata", columnDefinition = "jsonb")
    private String fusionMetadata;
    
    // Constructors, getters, setters
    public Event() {}
    
    public Event(String type, LocalDateTime startTime, Point location, String description) {
        this.type = type;
        this.startTime = startTime;
        this.location = location;
        this.description = description;
        this.status = EventStatus.PENDING;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
    
    public ClassificationLevel getClassificationLevel() { return classificationLevel; }
    public void setClassificationLevel(ClassificationLevel classificationLevel) { this.classificationLevel = classificationLevel; }
    
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    
    public Set<IntelligenceReport> getSourceReports() { return sourceReports; }
    public void setSourceReports(Set<IntelligenceReport> sourceReports) { this.sourceReports = sourceReports; }
    
    public List<Decision> getDecisions() { return decisions; }
    public void setDecisions(List<Decision> decisions) { this.decisions = decisions; }
    
    public String getFusionMetadata() { return fusionMetadata; }
    public void setFusionMetadata(String fusionMetadata) { this.fusionMetadata = fusionMetadata; }
}
