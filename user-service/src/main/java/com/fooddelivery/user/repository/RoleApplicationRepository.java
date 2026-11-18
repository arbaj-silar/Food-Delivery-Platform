
package com.fooddelivery.user.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fooddelivery.user.entity.RoleApplication;

@Repository
public interface RoleApplicationRepository
        extends JpaRepository<RoleApplication, Long> {

    List<RoleApplication> findByUser_IdOrderBySubmittedAtDesc(
            Long userId
    );

    List<RoleApplication> findByApplicationStatusIgnoreCaseOrderBySubmittedAtDesc(
            String applicationStatus
    );

    boolean existsByUser_IdAndRequestedRoleAndApplicationStatusIn(
            Long userId,
            String requestedRole,
            Collection<String> applicationStatuses
    );
    
    List<RoleApplication> findAllByOrderBySubmittedAtDesc();
}
