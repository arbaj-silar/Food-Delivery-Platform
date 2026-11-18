
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    X,
    SlidersHorizontal,
    ArrowDownAZ
} from "lucide-react";

import { getApprovedRestaurants } from "../../services/restaurantService";
import RestaurantCard from "../../components/RestaurantCard";

import "../../styles/restaurant/Restaurants.css";

export default function Restaurants() {

    const navigate = useNavigate();

    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCuisine, setSelectedCuisine] = useState("ALL");
    const [sortBy, setSortBy] = useState("AZ");

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getApprovedRestaurants();

            setRestaurants(data);

        } catch (err) {
            console.error("Restaurant loading failed:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load restaurants. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // Get unique cuisine types from restaurant data.
    const cuisines = useMemo(() => {
        return [
            ...new Set(
                restaurants
                    .map(restaurant => restaurant.cuisineType?.trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b));
    }, [restaurants]);

    // Search and filter restaurants.
    const filteredRestaurants = useMemo(() => {

        const search = searchTerm.trim().toLowerCase();

        return restaurants.filter(restaurant => {

            const searchableValues = [
                restaurant.name,
                restaurant.cuisineType,
                restaurant.city,
                restaurant.address,
                restaurant.description
            ];

            const matchesSearch =
                !search ||
                searchableValues.some(value =>
                    value?.toLowerCase().includes(search)
                );

            const matchesCuisine =
                selectedCuisine === "ALL" ||
                restaurant.cuisineType === selectedCuisine;

            return matchesSearch && matchesCuisine;
        });

    }, [restaurants, searchTerm, selectedCuisine]);

    // Sort filtered restaurants by name.
    const sortedRestaurants = useMemo(() => {

        return [...filteredRestaurants].sort((a, b) => {

            const comparison = (a.name || "").localeCompare(
                b.name || "",
                undefined,
                { sensitivity: "base" }
            );

            return sortBy === "ZA" ? -comparison : comparison;
        });

    }, [filteredRestaurants, sortBy]);

    if (loading) {
        return (
            <div className="restaurant-message">
                <h2>Finding restaurants near you...</h2>
                <p>Please wait.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="restaurant-message">
                <h2>Something went wrong</h2>
                <p>{error}</p>

                <button onClick={fetchRestaurants}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="restaurants-page">

            {/* PAGE HEADER */}
            <div className="restaurants-header">

                <div>
                    <h1>Discover Restaurants</h1>
                    <p>
                        Explore delicious food from our restaurants.
                    </p>
                </div>

                <span className="restaurant-count">
                    {sortedRestaurants.length} Restaurants
                </span>

            </div>

            {/* SEARCH, CUISINE FILTER AND SORTING */}
            <div className="restaurant-filters">

                {/* SEARCH */}
                <div className="restaurant-search">

                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search restaurants, cuisine or location..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                    />

                    {searchTerm && (
                        <button
                            type="button"
                            className="clear-search"
                            onClick={() => setSearchTerm("")}
                            aria-label="Clear search"
                        >
                            <X size={17} />
                        </button>
                    )}

                </div>

                {/* CUISINE FILTER */}
                <div className="restaurant-cuisine-filter">

                    <SlidersHorizontal size={18} />

                    <select
                        value={selectedCuisine}
                        onChange={(event) =>
                            setSelectedCuisine(event.target.value)
                        }
                    >
                        <option value="ALL">All Cuisines</option>

                        {cuisines.map(cuisine => (
                            <option key={cuisine} value={cuisine}>
                                {cuisine}
                            </option>
                        ))}

                    </select>

                </div>

                {/* SORTING */}
                <div className="restaurant-sort-filter">

                    <ArrowDownAZ size={18} />

                    <select
                        value={sortBy}
                        onChange={(event) =>
                            setSortBy(event.target.value)
                        }
                        aria-label="Sort restaurants"
                    >
                        <option value="AZ">Name: A to Z</option>
                        <option value="ZA">Name: Z to A</option>
                    </select>

                </div>

            </div>

            {/* RESTAURANT LIST */}
            {restaurants.length === 0 ? (

                <div className="restaurant-message">
                    <h2>No restaurants available</h2>
                    <p>Please check back later.</p>
                </div>

            ) : sortedRestaurants.length === 0 ? (

                <div className="restaurant-message">
                    <h2>No matching restaurants found</h2>

                    <p>
                        Try another restaurant name, location or cuisine.
                    </p>

                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setSelectedCuisine("ALL");
                            setSortBy("AZ");
                        }}
                    >
                        Clear Filters
                    </button>
                </div>

            ) : (

                <div className="restaurants-grid">

                    {sortedRestaurants.map(restaurant => (

                        <RestaurantCard
                            key={restaurant.id}
                            restaurant={restaurant}
                            onClick={() => {
                                navigate(
                                    `/restaurants/${restaurant.id}/menu`
                                );
                            }}
                        />

                    ))}

                </div>

            )}

        </div>
    );
}
