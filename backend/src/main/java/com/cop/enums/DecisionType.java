package com.cop.enums;

public enum DecisionType {
    REPORT_APPROVAL("Report Approval"),
    EVENT_APPROVAL("Event Approval"),
    OPERATIONAL_DECISION("Operational Decision"),
    INTELLIGENCE_ASSESSMENT("Intelligence Assessment"),
    RESOURCE_ALLOCATION("Resource Allocation"),
    MISSION_AUTHORIZATION("Mission Authorization");
    
    private final String displayName;
    
    DecisionType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean requiresJustification() {
        return this == OPERATIONAL_DECISION || this == MISSION_AUTHORIZATION;
    }
}
