
package com.fooddelivery.delivery.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

@Component
public class DeliveryDistanceCalculator {

    private static final double EARTH_RADIUS_KM = 6371.0088;

    public BigDecimal calculateDistanceKm(
            BigDecimal restaurantLatitude,
            BigDecimal restaurantLongitude,
            BigDecimal deliveryLatitude,
            BigDecimal deliveryLongitude) {

        if (restaurantLatitude == null
                || restaurantLongitude == null
                || deliveryLatitude == null
                || deliveryLongitude == null) {

            throw new IllegalArgumentException(
                    "Restaurant and delivery coordinates are required");
        }

        validateCoordinates(restaurantLatitude, restaurantLongitude);
        validateCoordinates(deliveryLatitude, deliveryLongitude);

        double lat1 = Math.toRadians(restaurantLatitude.doubleValue());
        double lon1 = Math.toRadians(restaurantLongitude.doubleValue());

        double lat2 = Math.toRadians(deliveryLatitude.doubleValue());
        double lon2 = Math.toRadians(deliveryLongitude.doubleValue());

        double latitudeDifference = lat2 - lat1;
        double longitudeDifference = lon2 - lon1;

        double a = Math.sin(latitudeDifference / 2)
                * Math.sin(latitudeDifference / 2)
                + Math.cos(lat1) * Math.cos(lat2)
                * Math.sin(longitudeDifference / 2)
                * Math.sin(longitudeDifference / 2);

        double c = 2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;

        return BigDecimal.valueOf(distance)
                .setScale(3, RoundingMode.HALF_UP);
    }

    private void validateCoordinates(
            BigDecimal latitude,
            BigDecimal longitude) {

        if (latitude.compareTo(BigDecimal.valueOf(-90)) < 0
                || latitude.compareTo(BigDecimal.valueOf(90)) > 0) {

            throw new IllegalArgumentException(
                    "Invalid latitude");
        }

        if (longitude.compareTo(BigDecimal.valueOf(-180)) < 0
                || longitude.compareTo(BigDecimal.valueOf(180)) > 0) {

            throw new IllegalArgumentException(
                    "Invalid longitude");
        }
    }
}
