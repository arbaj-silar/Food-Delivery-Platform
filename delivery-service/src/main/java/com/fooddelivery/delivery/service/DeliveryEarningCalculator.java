
package com.fooddelivery.delivery.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

@Component
public class DeliveryEarningCalculator {

    private static final BigDecimal BASE_FEE =
            new BigDecimal("20.00");

    private static final BigDecimal PER_KM_RATE =
            new BigDecimal("8.00");

    private static final BigDecimal MINIMUM_EARNING =
            new BigDecimal("30.00");

    public BigDecimal calculateEarning(BigDecimal distanceKm) {

        if (distanceKm == null
                || distanceKm.compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Distance cannot be null or negative");
        }

        BigDecimal calculatedEarning = BASE_FEE.add(
                distanceKm.multiply(PER_KM_RATE));

        if (calculatedEarning.compareTo(MINIMUM_EARNING) < 0) {
            calculatedEarning = MINIMUM_EARNING;
        }

        return calculatedEarning.setScale(
                2,
                RoundingMode.HALF_UP);
    }
}
