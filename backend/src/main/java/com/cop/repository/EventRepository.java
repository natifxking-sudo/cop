package com.cop.repository;

import com.cop.entity.Event;
import com.cop.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    List<Event> findByStatus(EventStatus status);
    
    List<Event> findByType(String type);
    
    @Query("SELECT e FROM Event e WHERE e.startTime BETWEEN :startDate AND :endDate")
    List<Event> findByTimeRange(@Param("startDate") LocalDateTime startDate, 
                               @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT e FROM Event e WHERE ST_DWithin(e.location, ST_GeomFromText(:point, 4326), :radiusMeters)")
    List<Event> findWithinRadius(@Param("point") String point, @Param("radiusMeters") double radiusMeters);
    
    @Query("SELECT e FROM Event e WHERE e.confidenceScore >= :minConfidence ORDER BY e.confidenceScore DESC")
    List<Event> findByMinimumConfidence(@Param("minConfidence") double minConfidence);
    
    @Query("SELECT e FROM Event e JOIN e.sourceReports r WHERE r.id = :reportId")
    List<Event> findBySourceReportId(@Param("reportId") Long reportId);
    
    @Query("SELECT e FROM Event e WHERE e.status = :status AND e.classificationLevel <= :maxClassification")
    List<Event> findByStatusAndMaxClassification(@Param("status") EventStatus status, 
                                                @Param("maxClassification") int maxClassification);
}
