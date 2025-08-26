package com.cop.entity;

import com.cop.enums.ClearanceLevel;
import com.cop.enums.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(unique = true)
    private String username;

    @NotBlank
    @Size(max = 100)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 120)
    @JsonIgnore
    private String password;

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClearanceLevel clearanceLevel;

    @Column(nullable = false)
    private Boolean active = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime lastLoginAt;

    @OneToMany(mappedBy = "submittedBy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<IntelligenceReport> reports = new HashSet<>();

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Decision> decisions = new HashSet<>();

    // Constructors
    public User() {}

    public User(String username, String email, String password, String fullName, UserRole role, ClearanceLevel clearanceLevel) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.clearanceLevel = clearanceLevel;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public ClearanceLevel getClearanceLevel() { return clearanceLevel; }
    public void setClearanceLevel(ClearanceLevel clearanceLevel) { this.clearanceLevel = clearanceLevel; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Set<IntelligenceReport> getReports() { return reports; }
    public void setReports(Set<IntelligenceReport> reports) { this.reports = reports; }

    public Set<Decision> getDecisions() { return decisions; }
    public void setDecisions(Set<Decision> decisions) { this.decisions = decisions; }
}
