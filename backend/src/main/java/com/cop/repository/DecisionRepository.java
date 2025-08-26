package com.cop.repository;

import com.cop.entity.Decision;
import com.cop.enums.ApprovalStatus;
import com.cop.enums.DecisionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DecisionRepository extends JpaRepository<Decision, Long> {
    
    List<Decision> findByHqUser_Id(Long hqUserId);
    
    List<Decision> findByDecisionType(DecisionType decisionType);
    
    List<Decision> findByApprovalStatus(ApprovalStatus approvalStatus);
    
    List<Decision> findByEvent_Id(Long eventId);
    
    List<Decision> findByReport_Id(Long reportId);
    
    @Query("SELECT d FROM Decision d WHERE d.decisionDate BETWEEN :startDate AND :endDate")
    List<Decision> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                  @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT d FROM Decision d WHERE d.requiresAction = true AND d.approvalStatus = 'PENDING'")
    List<Decision> findPendingActionItems();
    
    @Query("SELECT COUNT(d) FROM Decision d WHERE d.hqUser.id = :userId AND d.decisionDate >= :since")
    long countDecisionsByUserSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    @Query("SELECT d FROM Decision d WHERE d.priorityLevel >= :minPriority ORDER BY d.priorityLevel DESC, d.decisionDate DESC")
    List<Decision> findByMinimumPriority(@Param("minPriority") int minPriority);
}
