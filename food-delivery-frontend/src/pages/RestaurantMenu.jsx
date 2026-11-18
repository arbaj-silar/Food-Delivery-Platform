
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    MapPin,
    Bike,
    Clock,
    Plus,
    Minus,
    Utensils,
    Leaf
} from "lucide-react";

import { createOrder } from "../services/orderService";
import { getRestaurantMenu } from "../services/menuItemService";
import { getRestaurantById } from "../services/restaurantService";

import "../styles/restaurant/RestaurantMenu.css";

export default function RestaurantMenu() {

    const { restaurantId } = useParams();
    const navigate = useNavigate();

    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeCategory, setActiveCategory] = useState("");
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        setCart([]);
        setDeliveryAddress("");
        setDeliveryLocation(null);
        setSpecialInstructions("");
        setCheckoutError("");
        setOrderSuccess(false);

        loadRestaurantData();
    }, [restaurantId]);

    const loadRestaurantData = async () => {
        try {
            setLoading(true);
            setError("");

            const [restaurantData, menuData] = await Promise.all([
                getRestaurantById(restaurantId),
                getRestaurantMenu(restaurantId)
            ]);

            setRestaurant(restaurantData);
            setMenuItems(menuData);

            const categories = [
                ...new Set(menuData.map(item => item.category))
            ];

            setActiveCategory(categories[0] || "");

        } catch (err) {
            console.error("Menu loading failed:", err);
            setError("Unable to load restaurant menu.");
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        ...new Set(menuItems.map(item => item.category).filter(Boolean))
    ];

    const addToCart = (item) => {

        if (!restaurant.active) {
            setCheckoutError("This restaurant is currently inactive.");
            return;
        }

        if (!restaurant.deliveryAvailable) {
            setCheckoutError("This restaurant is currently not accepting delivery orders.");
            return;
        }

        setCheckoutError("");

        setCart(previous => {
            const existing = previous.find(
                cartItem => cartItem.id === item.id
            );

            if (existing) {
                return previous.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }

            return [...previous, { ...item, quantity: 1 }];
        });
    };

    const decreaseQuantity = (id) => {
        setCart(previous =>
            previous
                .map(item =>
                    item.id === id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    };
    const getMyLocation = () => {

        if (!navigator.geolocation) {
            setCheckoutError(
                "Your browser does not support location services."
            );
            return;
        }

        setLocationLoading(true);
        setCheckoutError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {

                setDeliveryLocation({
                    deliveryLatitude: position.coords.latitude,
                    deliveryLongitude: position.coords.longitude
                });

                setLocationLoading(false);
            },
            (error) => {

                console.error("Location error:", error);

                setCheckoutError(
                    "Unable to get your location. Please allow location access and try again."
                );

                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    };

    const handleCheckout = async () => {
        if (!deliveryAddress.trim()) {
            setCheckoutError("Please enter your delivery address.");
            return;
        }

        if (!deliveryLocation) {
            setCheckoutError("Please capture your delivery location before placing the order.");
            return;
        }

        if (cart.length === 0) {
            setCheckoutError("Your cart is empty.");
            return;
        }

        if (!restaurant.deliveryAvailable) {
            setCheckoutError("Delivery is currently unavailable.");
            return;
        }

        try {
            setCheckoutLoading(true);
            setCheckoutError("");
            setOrderSuccess(false);

            const orderData = {
                restaurantId: Number(restaurantId),
                deliveryAddress: deliveryAddress.trim(),

                deliveryLatitude: deliveryLocation.deliveryLatitude,
                deliveryLongitude: deliveryLocation.deliveryLongitude,

                specialInstructions: specialInstructions.trim(),

                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity
                }))
            };

            await createOrder(orderData);

            setOrderSuccess(true);
            setCart([]);

        } catch (error) {
            console.error("Order placement failed:", error);

            setCheckoutError(
                error.response?.data?.message ||
                "Unable to place your order. Please try again."
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const totalPrice = cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const formatPrice = (price) =>
        Number(price).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR"
        });

    const scrollToCategory = (category) => {
        setActiveCategory(category);

        document.getElementById(`category-${category}`)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    };

    if (loading) {
        return <div className="menu-loading">Loading restaurant menu...</div>;
    }

    if (error || !restaurant) {
        return (
            <div className="menu-loading">
                <h2>{error || "Restaurant not found"}</h2>
                <button onClick={() => navigate("/restaurants")}>
                    Back to Restaurants
                </button>
            </div>
        );
    }

    return (
        <div className="restaurant-menu-page">

            <main className="menu-main">

                <div className="menu-category-nav">
                    {categories.map(category => (
                        <button
                            key={category}
                            className={
                                activeCategory === category
                                    ? "category-tab active"
                                    : "category-tab"
                            }
                            onClick={() => scrollToCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="menu-restaurant-heading">
                    <h1>{restaurant.name}</h1>
                    <p>
                        {restaurant.cuisineType} • {restaurant.city}
                    </p>
                </div>

                {categories.length === 0 ? (
                    <div className="empty-menu">
                        <Utensils size={45} />
                        <h2>No menu items available</h2>
                    </div>
                ) : (
                    categories.map(category => {

                        const items = menuItems.filter(
                            item => item.category === category
                        );

                        return (
                            <section
                                key={category}
                                id={`category-${category}`}
                                className="menu-category-section"
                            >
                                <h2>{category}</h2>

                                <div className="food-grid">

                                    {items.map(item => {

                                        const cartItem = cart.find(
                                            cartItem => cartItem.id === item.id
                                        );

                                        return (
                                            <article
                                                className="food-card"
                                                key={item.id}
                                            >

                                                <div className="food-image">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                        />
                                                    ) : (
                                                        <div className="food-placeholder">
                                                            <Utensils size={45} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="food-info">

                                                    <h3>{item.name}</h3>

                                                    <p className="food-description">
                                                        {item.description ||
                                                            "Delicious food prepared fresh."}
                                                    </p>

                                                    <span className={
                                                        item.vegetarian
                                                            ? "food-veg"
                                                            : "food-nonveg"
                                                    }>
                                                        {item.vegetarian
                                                            ? <Leaf size={14} />
                                                            : <Utensils size={14} />}
                                                        {item.vegetarian
                                                            ? "Vegetarian"
                                                            : "Non-Vegetarian"}
                                                    </span>

                                                    <div className="food-price-row">

                                                        <strong>
                                                            {formatPrice(item.price)}
                                                        </strong>

                                                        {cartItem ? (
                                                            <div className="quantity-control">
                                                                <button
                                                                    onClick={() =>
                                                                        decreaseQuantity(item.id)
                                                                    }
                                                                >
                                                                    <Minus size={15} />
                                                                </button>

                                                                <span>
                                                                    {cartItem.quantity}
                                                                </span>

                                                                <button
                                                                    onClick={() =>
                                                                        addToCart(item)
                                                                    }
                                                                >
                                                                    <Plus size={15} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="order-now-btn"
                                                                onClick={() =>
                                                                    addToCart(item)
                                                                }
                                                            >
                                                                Order Now
                                                            </button>
                                                        )}

                                                    </div>

                                                </div>
                                            </article>
                                        );
                                    })}

                                </div>
                            </section>
                        );
                    })
                )}

            </main>

            <aside className="menu-sidebar">

                <div className="restaurant-side-card">
                    <small>Restaurant</small>
                    <h2>{restaurant.name}</h2>

                    <p>
                        <MapPin size={15} />
                        {restaurant.city}
                    </p>

                    <p>
                        <Clock size={15} />
                        {restaurant.openingTime || "--:--"} -
                        {restaurant.closingTime || "--:--"}
                    </p>
                </div>

                <div className="delivery-card">
                    <h3>
                        <Bike size={19} />
                        Delivery
                    </h3>

                    <p>
                        {restaurant.deliveryAvailable
                            ? "Delivery available"
                            : "Delivery currently unavailable"}
                    </p>
                </div>

                <div className="cart-card">

                    <h2>Your Order</h2>

                    <div className="cart-items">

                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingCart size={65} />
                                <p>Cart is empty. Add menu items.</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div className="cart-item" key={item.id}>

                                    <div>
                                        <strong>{item.name}</strong>
                                        <small>
                                            {formatPrice(item.price)}
                                        </small>
                                    </div>

                                    <div className="cart-quantity">
                                        <button
                                            onClick={() =>
                                                decreaseQuantity(item.id)
                                            }
                                        >
                                            <Minus size={13} />
                                        </button>

                                        <span>{item.quantity}</span>

                                        <button
                                            onClick={() => addToCart(item)}
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>

                                </div>
                            ))
                        )}

                    </div>

                    <div className="checkout-form">

                        <h3>Delivery Details</h3>

                        <textarea
                            placeholder="Enter your complete delivery address"
                            value={deliveryAddress}
                            onChange={(e) => {
                                setDeliveryAddress(e.target.value);
                                setDeliveryLocation(null);
                                setCheckoutError("");
                            }}
                            rows={3}
                        />

                        <button
                            type="button"
                            className="get-location-btn"
                            onClick={getMyLocation}
                            disabled={locationLoading}
                        >
                            <MapPin size={16} />

                            {locationLoading
                                ? "Getting Location..."
                                : deliveryLocation
                                    ? "Location Captured ✓"
                                    : "Get My Location"}
                        </button>

                        {deliveryLocation && (
                            <small className="location-success">
                                Location captured successfully.
                                <br />
                                Latitude: {deliveryLocation.deliveryLatitude.toFixed(6)}
                                <br />
                                Longitude: {deliveryLocation.deliveryLongitude.toFixed(6)}
                            </small>
                        )}

                        <textarea
                            placeholder="Special instructions (optional)"
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            rows={2}
                        />

                    </div>

                    {checkoutError && (
                        <p className="checkout-error">{checkoutError}</p>
                    )}

                    {orderSuccess && (
                        <div className="checkout-success">
                            <p>Your order has been placed successfully!</p>

                            <button
                                type="button"
                                onClick={() => navigate("/my-orders")}
                            >
                                View My Orders
                            </button>
                        </div>
                    )}

                    <div className="cart-total">
                        <span>Items ({totalItems})</span>
                        <strong>{formatPrice(totalPrice)}</strong>
                    </div>

                    <button
                        className="checkout-btn"
                        disabled={
                            cart.length === 0 ||
                            checkoutLoading ||
                            !restaurant.active ||
                            !restaurant.deliveryAvailable
                        }
                        onClick={handleCheckout}
                    >
                        {checkoutLoading
                            ? "Placing Order..."
                            : "Place Order →"}
                    </button>

                    <small className="minimum-order">
                        Subtotal: {formatPrice(totalPrice)}
                    </small>

                </div>

            </aside>

        </div>
    );
}
