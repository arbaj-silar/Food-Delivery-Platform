
package com.fooddelivery.menu.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fooddelivery.menu.entity.MenuItem;

public interface MenuItemRepository
        extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByRestaurantId(Long restaurantId);

    List<MenuItem> findByRestaurantIdAndAvailableTrue(Long restaurantId);

    List<MenuItem> findByRestaurantIdAndCategoryIgnoreCase(
            Long restaurantId, String category);

    boolean existsByRestaurantIdAndNameIgnoreCase(
            Long restaurantId, String name);
}
