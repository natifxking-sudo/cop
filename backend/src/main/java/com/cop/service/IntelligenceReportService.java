package com.cop.service;

import com.cop.dto.CreateReportRequest;
import com.cop.dto.UpdateReportRequest;
import com.cop.entity.IntelligenceReport;
import com.cop.entity.User;
import com.cop.enums.ClearanceLevel;
import com.cop.enums.ReportStatus;
import com.cop.repository.IntelligenceReportRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class IntelligenceReportService {

    @Autowired
    private IntelligenceReportRepository reportRepository;

    @Autowired
    private UserService userService;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    public IntelligenceReport createReport(CreateReportRequest request, String username) {
        User user = userService.findByUsername(username);
        
        IntelligenceReport report = new IntelligenceReport();
        report.setTitle(request.getTitle());
        report.setContent(request.getContent());
        report.setType(request.getType());
        report.setClearanceLevel(request.getClearanceLevel());
        report.setEventTime(request.getEventTime());
        report.setSubmittedBy(user);
        report.setStatus(ReportStatus.PENDING);
        
        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point location = geometryFactory.createPoint(
                new Coordinate(request.getLongitude(), request.getLatitude())
            );
            location.setSRID(4326);
            report.setLocation(location);
        }
        
        if (request.getMetadata() != null) {
            report.setMetadata(request.getMetadata());
        }
        
        return reportRepository.save(report);
    }

    public IntelligenceReport updateReport(Long id, UpdateReportRequest request, String username) {
        IntelligenceReport report = findById(id);
        User user = userService.findByUsername(username);
        
        // Check if user can update this report
        if (!report.getSubmittedBy().getId().equals(user.getId()) && 
            !user.getRole().name().equals("HQ")) {
            throw new RuntimeException("Unauthorized to update this report");
        }
        
        if (request.getTitle() != null) {
            report.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            report.setContent(request.getContent());
        }
        if (request.getEventTime() != null) {
            report.setEventTime(request.getEventTime());
        }
        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point location = geometryFactory.createPoint(
                new Coordinate(request.getLongitude(), request.getLatitude())
            );
            location.setSRID(4326);
            report.setLocation(location);
        }
        if (request.getMetadata() != null) {
            report.getMetadata().putAll(request.getMetadata());
        }
        
        return reportRepository.save(report);
    }

    public IntelligenceReport approveReport(Long id, String reviewComments, String username) {
        IntelligenceReport report = findById(id);
        User reviewer = userService.findByUsername(username);
        
        report.setStatus(ReportStatus.APPROVED);
        report.setReviewedBy(reviewer);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewComments(reviewComments);
        
        return reportRepository.save(report);
    }

    public IntelligenceReport rejectReport(Long id, String reviewComments, String username) {
        IntelligenceReport report = findById(id);
        User reviewer = userService.findByUsername(username);
        
        report.setStatus(ReportStatus.REJECTED);
        report.setReviewedBy(reviewer);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewComments(reviewComments);
        
        return reportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public IntelligenceReport findById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Page<IntelligenceReport> findAll(Pageable pageable) {
        return reportRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<IntelligenceReport> findByStatus(ReportStatus status, Pageable pageable) {
        return reportRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public Page<IntelligenceReport> findBySubmittedBy(User user, Pageable pageable) {
        return reportRepository.findBySubmittedBy(user, pageable);
    }

    @Transactional(readOnly = true)
    public List<IntelligenceReport> findByLocationWithin(double latitude, double longitude, double radiusKm) {
        Point center = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        center.setSRID(4326);
        return reportRepository.findByLocationWithinDistance(center, radiusKm * 1000); // Convert to meters
    }

    @Transactional(readOnly = true)
    public List<IntelligenceReport> findByClearanceLevelAccessible(ClearanceLevel userClearance) {
        return reportRepository.findByClearanceLevelLessThanEqual(userClearance);
    }

    public void deleteReport(Long id, String username) {
        IntelligenceReport report = findById(id);
        User user = userService.findByUsername(username);
        
        // Only allow deletion by the submitter or HQ
        if (!report.getSubmittedBy().getId().equals(user.getId()) && 
            !user.getRole().name().equals("HQ")) {
            throw new RuntimeException("Unauthorized to delete this report");
        }
        
        reportRepository.delete(report);
    }
}
