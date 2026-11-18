package com.fooddelivery.payment.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fooddelivery.payment.dto.DeliveryEarningResponse;
import com.fooddelivery.payment.dto.DeliveryEarningStatisticsResponse;
import com.fooddelivery.payment.entity.DeliveryEarning;
import com.fooddelivery.payment.enums.EarningStatus;
import com.fooddelivery.payment.repository.DeliveryEarningRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeliveryEarningService {

    private final DeliveryEarningRepository earningRepository;

    @Transactional(readOnly = true)
    public List<DeliveryEarningResponse> getMyEarnings(
            Long deliveryPartnerId) {

        return earningRepository
                .findByDeliveryPartnerIdOrderByCompletedAtDesc(
                        deliveryPartnerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalEarnings(Long deliveryPartnerId) {

        return sumByStatus(
                deliveryPartnerId,
                EarningStatus.AVAILABLE);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTodayEarnings(Long deliveryPartnerId) {

        LocalDate today = LocalDate.now();

        return getEarningsBetween(
                deliveryPartnerId,
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );
    }

    @Transactional(readOnly = true)
    public BigDecimal getMonthlyEarnings(Long deliveryPartnerId) {

        LocalDate today = LocalDate.now();

        return getEarningsBetween(
                deliveryPartnerId,
                today.withDayOfMonth(1).atStartOfDay(),
                today.withDayOfMonth(1).plusMonths(1).atStartOfDay()
        );
    }

    @Transactional(readOnly = true)
    public DeliveryEarningStatisticsResponse getStatistics(
            Long deliveryPartnerId) {

        List<DeliveryEarning> earnings = earningRepository
                .findByDeliveryPartnerIdOrderByCompletedAtDesc(
                        deliveryPartnerId);

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
        BigDecimal available = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;

        BigDecimal today = BigDecimal.ZERO;
        BigDecimal monthly = BigDecimal.ZERO;

        LocalDate currentDate = LocalDate.now();
        LocalDateTime monthStart =
                currentDate.withDayOfMonth(1).atStartOfDay();
        LocalDateTime nextMonth =
                monthStart.plusMonths(1);
        LocalDateTime todayStart =
                currentDate.atStartOfDay();
        LocalDateTime tomorrowStart =
                todayStart.plusDays(1);

        long completedDeliveries = 0;

        for (DeliveryEarning earning : earnings) {

            if (earning.getEarningStatus() == EarningStatus.REVERSED) {
                continue;
            }

            BigDecimal amount = earning.getAmount();

            total = total.add(amount);
            completedDeliveries++;

            if (earning.getEarningStatus() == EarningStatus.PENDING) {
                pending = pending.add(amount);
            }

            if (earning.getEarningStatus() == EarningStatus.AVAILABLE) {
                available = available.add(amount);
            }

            if (earning.getEarningStatus() == EarningStatus.PAID) {
                paid = paid.add(amount);
            }

            LocalDateTime completedAt = earning.getCompletedAt();

            if (completedAt != null) {

                if (!completedAt.isBefore(todayStart)
                        && completedAt.isBefore(tomorrowStart)) {
                    today = today.add(amount);
                }

                if (!completedAt.isBefore(monthStart)
                        && completedAt.isBefore(nextMonth)) {
                    monthly = monthly.add(amount);
                }
            }
        }

        BigDecimal average = completedDeliveries > 0
                ? total.divide(
                        BigDecimal.valueOf(completedDeliveries),
                        2,
                        java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return DeliveryEarningStatisticsResponse.builder()
                .totalEarnings(total)
                .todayEarnings(today)
                .monthlyEarnings(monthly)
                .pendingEarnings(pending)
                .availableEarnings(available)
                .paidEarnings(paid)
                .completedDeliveries(completedDeliveries)
                .averageEarningPerDelivery(average)
                .build();
    }

    private BigDecimal sumByStatus(
            Long deliveryPartnerId,
            EarningStatus status) {

        return earningRepository
                .findByDeliveryPartnerIdAndEarningStatus(
                        deliveryPartnerId,
                        status)
                .stream()
                .map(DeliveryEarning::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal getEarningsBetween(
            Long deliveryPartnerId,
            LocalDateTime start,
            LocalDateTime end) {

        return earningRepository
                .findByDeliveryPartnerIdAndCompletedAtBetween(
                        deliveryPartnerId,
                        start,
                        end)
                .stream()
                .filter(earning ->
                        earning.getEarningStatus() != EarningStatus.REVERSED)
                .map(DeliveryEarning::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private DeliveryEarningResponse mapToResponse(
            DeliveryEarning earning) {

        return DeliveryEarningResponse.builder()
                .id(earning.getId())
                .deliveryAssignmentId(earning.getDeliveryAssignmentId())
                .orderId(earning.getOrderId())
                .deliveryPartnerId(earning.getDeliveryPartnerId())
                .amount(earning.getAmount())
                .earningStatus(earning.getEarningStatus())
                .completedAt(earning.getCompletedAt())
                .createdAt(earning.getCreatedAt())
                .build();
    }
    
    @Transactional
    public DeliveryEarningResponse createEarning(
            Long deliveryAssignmentId,
            Long orderId,
            Long deliveryPartnerId,
            BigDecimal amount,
            LocalDateTime completedAt) {

        if (earningRepository.existsByDeliveryAssignmentId(deliveryAssignmentId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Earning already exists for this delivery assignment"
            );
        }

        DeliveryEarning earning = DeliveryEarning.builder()
                .deliveryAssignmentId(deliveryAssignmentId)
                .orderId(orderId)
                .deliveryPartnerId(deliveryPartnerId)
                .amount(amount)
                .earningStatus(EarningStatus.AVAILABLE)
                .completedAt(completedAt)
                .build();

        DeliveryEarning saved = earningRepository.save(earning);

        return mapToResponse(saved);
    }
}