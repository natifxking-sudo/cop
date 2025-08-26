package com.cop.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "decisions")
public class Decision extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hq_user_id", nullable = false)
    private User hqUser;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private IntelligenceReport report;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "decision_type", nullable = false)
    private DecisionType decisionType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false)
    private ApprovalStatus approvalStatus;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(columnDefinition = "TEXT")
    private String reasoning;
    
    @Column(name = "decision_date", nullable = false)
    private LocalDateTime decisionDate;
    
    @Column(name = "priority_level")
    private Integer priorityLevel;
    
    @Column(name = "requires_action")
    private Boolean requiresAction;
    
    @Column(name = "action_taken", columnDefinition = "TEXT")
    private String actionTaken;
    
    // Constructors
    public Decision() {}
    
    public Decision(User hqUser, DecisionType decisionType, ApprovalStatus approvalStatus) {
        this.hqUser = hqUser;
        this.decisionType = decisionType;
        this.approvalStatus = approvalStatus;
        this.decisionDate = LocalDateTime.now();
        this.requiresAction = false;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getHqUser() { return hqUser; }
    public void setHqUser(User hqUser) { this.hqUser = hqUser; }
    
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    
    public IntelligenceReport getReport() { return report; }
    public void setReport(IntelligenceReport report) { this.report = report; }
    
    public DecisionType getDecisionType() { return decisionType; }
    public void setDecisionType(DecisionType decisionType) { this.decisionType = decisionType; }
    
    public ApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }
    
    public LocalDateTime getDecisionDate() { return decisionDate; }
    public void setDecisionDate(LocalDateTime decisionDate) { this.decisionDate = decisionDate; }
    
    public Integer getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(Integer priorityLevel) { this.priorityLevel = priorityLevel; }
    
    public Boolean getRequiresAction() { return requiresAction; }
    public void setRequiresAction(Boolean requiresAction) { this.requiresAction = requiresAction; }
    
    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }
}
