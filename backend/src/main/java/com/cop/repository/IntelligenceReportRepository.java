package com.cop.repository;

import com.cop.entity.IntelligenceReport;
import com.cop.enums.IntelligenceType;
import com.cop.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IntelligenceReportRepository extends JpaRepository<IntelligenceReport, Long> {
    
    List<IntelligenceReport> findBySubmittedBy_Id(Long userId);
    
    List<IntelligenceReport> findByIntelligenceType(IntelligenceType type);
    
    List<IntelligenceReport> findByStatus(ReportStatus status);
    
    @Query("SELECT r FROM IntelligenceReport r WHERE r.submittedAt BETWEEN :startDate AND :endDate")
    List<IntelligenceReport> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT r FROM IntelligenceReport r WHERE r.intelligenceType = :type AND r.status = :status")
    List<IntelligenceReport> findByTypeAndStatus(@Param("type") IntelligenceType type, 
                                                @Param("status") ReportStatus status);
    
    @Query("SELECT r FROM IntelligenceReport r WHERE ST_DWithin(r.location, ST_GeomFromText(:point, 4326), :radiusMeters)")
    List<IntelligenceReport> findWithinRadius(@Param("point") String point, @Param("radiusMeters") double radiusMeters);
    
    @Query("SELECT r FROM IntelligenceReport r WHERE r.classificationLevel <= :maxClassification ORDER BY r.submittedAt DESC")
    List<IntelligenceReport> findByMaxClassificationLevel(@Param("maxClassification") int maxClassification);
    
    @Query("SELECT COUNT(r) FROM IntelligenceReport r WHERE r.intelligenceType = :type AND r.submittedAt >= :since")
    long countByTypeAndDateSince(@Param("type") IntelligenceType type, @Param("since") LocalDateTime since);
}
