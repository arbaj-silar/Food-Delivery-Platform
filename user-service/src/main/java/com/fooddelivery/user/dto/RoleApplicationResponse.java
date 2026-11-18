
package com.fooddelivery.user.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RoleApplicationResponse {

    private Long id;

    private Long userId;

    private String fullName;

    private String email;

    private String phone;

    private String requestedRole;

    private String applicationStatus;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private Long reviewedById;

    private String reviewedByName;

    private String rejectionReason;
}