package com.cop.enums;

public enum EventStatus {
    PENDING("Pending Review"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    UNDER_REVIEW("Under Review"),
    REQUIRES_MORE_INFO("Requires More Information"),
    ARCHIVED("Archived");
    
    private final String displayName;
    
    EventStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isActive() {
        return this != ARCHIVED && this != REJECTED;
    }
    
    public boolean requiresAction() {
        return this == PENDING || this == UNDER_REVIEW || this == REQUIRES_MORE_INFO;
    }
}
