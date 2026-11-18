
import {
    MapPin,
    Clock,
    Bike,
    Utensils,
    ArrowUpRight
} from "lucide-react";

export default function RestaurantCard({ restaurant, onClick }) {

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
        }
    };

    return (
        <article
            className="restaurant-card"
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View menu at ${restaurant.name}`}
        >
            {/* LEFT: RESTAURANT IMAGE */}
            <div className="restaurant-image">

                {restaurant.imageUrl ? (
                    <img
                        src={restaurant.imageUrl}
                        alt={restaurant.name}
                        loading="lazy"
                    />
                ) : (
                    <div className="restaurant-placeholder">
                        <Utensils size={48} />
                    </div>
                )}

                <span className="cuisine-badge">
                    {restaurant.cuisineType || "Restaurant"}
                </span>

            </div>

            {/* RIGHT: RESTAURANT DETAILS */}
            <div className="restaurant-info">

                <div className="restaurant-heading">
                    <div>
                        <h3>{restaurant.name}</h3>
                        <span className="restaurant-category">
                            {restaurant.cuisineType || "Restaurant"}
                        </span>
                    </div>

                    <span className="restaurant-arrow">
                        <ArrowUpRight size={20} />
                    </span>
                </div>

                <p className="restaurant-description">
                    {restaurant.description ||
                        "Freshly prepared food made with love. Discover your next favourite meal."}
                </p>

                <div className="restaurant-meta">

                    <div className="restaurant-location">
                        <MapPin size={16} />
                        <span>
                            {restaurant.city || restaurant.address || "Location unavailable"}
                        </span>
                    </div>

                    <div className="restaurant-timing">
                        <Clock size={16} />
                        <span>
                            {restaurant.openingTime || "--:--"}
                            {" - "}
                            {restaurant.closingTime || "--:--"}
                        </span>
                    </div>

                </div>

                <div className="restaurant-card-footer">

                    <span className={
                        restaurant.deliveryAvailable
                            ? "restaurant-delivery-badge available"
                            : "restaurant-delivery-badge unavailable"
                    }>
                        <Bike size={16} />
                        {restaurant.deliveryAvailable
                            ? "Delivery Available"
                            : "Delivery Unavailable"}
                    </span>

                    <button
                        type="button"
                        className="view-menu-btn"
                        onClick={(event) => {
                            event.stopPropagation();
                            onClick();
                        }}
                    >
                        View Menu
                        <ArrowUpRight size={17} />
                    </button>

                </div>

            </div>
        </article>
    );
}
