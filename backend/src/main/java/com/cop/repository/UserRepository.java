package com.cop.repository;

import com.cop.entity.User;
import com.cop.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByActiveTrue();
    
    @Query("SELECT u FROM User u WHERE u.role IN :roles AND u.active = true")
    List<User> findByRolesAndActive(@Param("roles") List<UserRole> roles);
    
    @Query("SELECT u FROM User u WHERE u.clearanceLevel >= :minClearance AND u.active = true")
    List<User> findByMinimumClearanceLevel(@Param("minClearance") int minClearance);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.active = true")
    long countActiveUsersByRole(@Param("role") UserRole role);
}
