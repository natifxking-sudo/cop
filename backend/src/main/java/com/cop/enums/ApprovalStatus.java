package com.cop.enums;

public enum ApprovalStatus {
    APPROVED("Approved"),
    REJECTED("Rejected"),
    PENDING("Pending"),
    CONDITIONAL("Conditional Approval"),
    REQUIRES_REVISION("Requires Revision");
    
    private final String displayName;
    
    ApprovalStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isFinal() {
        return this == APPROVED || this == REJECTED;
    }
    
    public boolean requiresAction() {
        return this == PENDING || this == REQUIRES_REVISION;
    }
}
