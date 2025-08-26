package com.cop.enums;

public enum UserRole {
    HQ("HQ Commander"),
    ANALYST_SOCMINT("SOCMINT Analyst"),
    ANALYST_SIGINT("SIGINT Analyst"), 
    ANALYST_HUMINT("HUMINT Analyst"),
    OBSERVER("Observer");
    
    private final String displayName;
    
    UserRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isAnalyst() {
        return this == ANALYST_SOCMINT || this == ANALYST_SIGINT || this == ANALYST_HUMINT;
    }
    
    public boolean canSubmitReports() {
        return isAnalyst();
    }
    
    public boolean canMakeDecisions() {
        return this == HQ;
    }
    
    public boolean canViewAllIntelligence() {
        return this == HQ || isAnalyst();
    }
}
