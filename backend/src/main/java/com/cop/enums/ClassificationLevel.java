package com.cop.enums;

public enum ClassificationLevel {
    UNCLASSIFIED(0, "U"),
    CONFIDENTIAL(1, "C"),
    SECRET(2, "S"),
    TOP_SECRET(3, "TS");
    
    private final int level;
    private final String abbreviation;
    
    ClassificationLevel(int level, String abbreviation) {
        this.level = level;
        this.abbreviation = abbreviation;
    }
    
    public int getLevel() {
        return level;
    }
    
    public String getAbbreviation() {
        return abbreviation;
    }
    
    public boolean canAccess(ClassificationLevel userClearance) {
        return userClearance.level >= this.level;
    }
    
    public static ClassificationLevel fromString(String classification) {
        for (ClassificationLevel level : values()) {
            if (level.name().equalsIgnoreCase(classification) || 
                level.abbreviation.equalsIgnoreCase(classification)) {
                return level;
            }
        }
        return UNCLASSIFIED;
    }
}
