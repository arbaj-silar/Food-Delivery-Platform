
import { useEffect, useMemo, useState } from "react";

import {
    Plus,
    Search,
    Utensils,
    RefreshCw,
    Leaf,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    X,
    ImagePlus,
    Save
} from "lucide-react";

import { getMyRestaurants } from "../../services/restaurantService";

import {
    getMyRestaurantMenu,
    updateMenuItemAvailability,
    deleteMenuItem,
    createMenuItem,
    updateMenuItem
} from "../../services/menuItemService";

import "../../styles/restaurant/MenuManagement.css";

export default function MenuManagement() {

    const initialForm = {
        name: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        vegetarian: true,
        available: true
    };

    const [editingItem, setEditingItem] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("");

    const [menuItems, setMenuItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const loadRestaurants = async () => {
        try {
            setError("");

            const data = await getMyRestaurants();

            setRestaurants(data || []);

            const firstApproved = data?.find(
                restaurant => restaurant.status === "APPROVED"
            );

            if (firstApproved) {
                setSelectedRestaurant(String(firstApproved.id));
            } else if (data?.length > 0) {
                setSelectedRestaurant(String(data[0].id));
            } else {
                setLoading(false);
            }

        } catch (err) {
            console.error("Restaurant loading error:", err);
            setError("Unable to load your restaurants.");
            setLoading(false);
        }
    };

    const loadMenu = async (restaurantId) => {

        if (!restaurantId) {
            setMenuItems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data = await getMyRestaurantMenu(restaurantId);

            setMenuItems(data || []);

        } catch (err) {
            console.error("Menu loading error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load menu items."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRestaurants();
    }, []);

    useEffect(() => {
        if (selectedRestaurant) {
            loadMenu(selectedRestaurant);
        }
    }, [selectedRestaurant]);

    const categories = useMemo(() => {
        const uniqueCategories = [
            ...new Set(
                menuItems
                    .map(item => item.category)
                    .filter(Boolean)
            )
        ];

        return ["All", ...uniqueCategories];
    }, [menuItems]);

    const filteredItems = useMemo(() => {

        return menuItems.filter(item => {

            const matchesSearch =
                item.name?.toLowerCase().includes(search.toLowerCase()) ||
                item.category?.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" ||
                item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

    }, [menuItems, search, selectedCategory]);

    const handleAvailability = async (item) => {

        try {
            const updated = await updateMenuItemAvailability(
                item.id,
                !item.available
            );

            setMenuItems(previous =>
                previous.map(current =>
                    current.id === item.id ? updated : current
                )
            );

        } catch (err) {
            console.error("Availability update error:", err);
            alert(
                err.response?.data?.message ||
                "Unable to update item availability."
            );
        }
    };

    const handleDelete = async (item) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${item.name}"?`
        );

        if (!confirmed) return;

        try {
            await deleteMenuItem(item.id);

            setMenuItems(previous =>
                previous.filter(current => current.id !== item.id)
            );

        } catch (err) {
            console.error("Delete menu item error:", err);
            alert(
                err.response?.data?.message ||
                "Unable to delete menu item."
            );
        }
    };

    const totalItems = menuItems.length;

    const availableItems = menuItems.filter(
        item => item.available
    ).length;

    const unavailableItems = totalItems - availableItems;

    const vegetarianItems = menuItems.filter(
        item => item.vegetarian
    ).length;

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(previous => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleCreateMenuItem = async (e) => {
        e.preventDefault();

        if (!selectedRestaurant) {
            setFormError("Please select a restaurant.");
            return;
        }

        if (!formData.name.trim()) {
            setFormError("Dish name is required.");
            return;
        }

        if (!formData.category.trim()) {
            setFormError("Category is required.");
            return;
        }

        if (!formData.price || Number(formData.price) <= 0) {
            setFormError("Enter a valid price greater than zero.");
            return;
        }

        if (formData.imageUrl.length > 500) {
            setFormError("Image URL cannot exceed 500 characters.");
            return;
        }

        try {
            setSaving(true);
            setFormError("");

            const payload = {
                restaurantId: Number(selectedRestaurant),
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number(formData.price),
                category: formData.category.trim(),
                imageUrl: formData.imageUrl.trim(),
                vegetarian: formData.vegetarian,
                available: formData.available
            };

            let savedItem;

            if (editingItem) {
                savedItem = await updateMenuItem(
                    editingItem.id,
                    payload
                );

                setMenuItems(previous =>
                    previous.map(item =>
                        item.id === editingItem.id
                            ? savedItem
                            : item
                    )
                );
            } else {
                savedItem = await createMenuItem(payload);

                setMenuItems(previous => [
                    ...previous,
                    savedItem
                ]);
            }

            setFormData(initialForm);
            setEditingItem(null);
            setShowAddModal(false);

        } catch (err) {
            console.error("Save menu item error:", err);

            setFormError(
                err.response?.data?.message ||
                "Unable to save menu item. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);

        setFormData({
            name: item.name || "",
            description: item.description || "",
            price: String(item.price ?? ""),
            category: item.category || "",
            imageUrl: item.imageUrl || "",
            vegetarian: Boolean(item.vegetarian),
            available: Boolean(item.available)
        });

        setFormError("");
        setShowAddModal(true);
    };


    if (loading && restaurants.length === 0) {
        return (
            <div className="menu-loading">
                Loading restaurant information...
            </div>
        );
    }

    return (
        <div className="menu-management-page">

            <div className="menu-management-header">

                <div>
                    <span className="menu-eyebrow">
                        RESTAURANT MANAGEMENT
                    </span>

                    <h1>Menu Management</h1>

                    <p>
                        Manage your dishes, prices and availability.
                    </p>
                </div>

                <button
                    className="menu-add-button"
                    type="button"
                    onClick={() => {
                        setFormData(initialForm);
                        setFormError("");
                        setShowAddModal(true);
                    }}
                    disabled={!selectedRestaurant}
                >
                    <Plus size={19} />
                    Add Menu Item
                </button>

            </div>

            <div className="menu-toolbar">

                <div className="menu-restaurant-select">

                    <label>Select Restaurant</label>

                    <select
                        value={selectedRestaurant}
                        onChange={e => setSelectedRestaurant(e.target.value)}
                    >
                        {restaurants.map(restaurant => (
                            <option
                                key={restaurant.id}
                                value={restaurant.id}
                            >
                                {restaurant.name}
                            </option>
                        ))}
                    </select>

                </div>

                <button
                    type="button"
                    className="menu-refresh-button"
                    onClick={() => loadMenu(selectedRestaurant)}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>

            </div>

            {error && (
                <div className="menu-error">
                    {error}
                </div>
            )}

            {!loading && restaurants.length === 0 && (
                <div className="menu-empty-state">
                    <StoreIcon />
                    <h2>No restaurants registered</h2>
                    <p>Register your restaurant before adding menu items.</p>
                </div>
            )}

            {restaurants.length > 0 && (
                <>

                    <div className="menu-stat-grid">

                        <div className="menu-stat-card">
                            <span>Total Menu Items</span>
                            <h2>{totalItems}</h2>
                        </div>

                        <div className="menu-stat-card">
                            <span>Available Items</span>
                            <h2>{availableItems}</h2>
                        </div>

                        <div className="menu-stat-card">
                            <span>Unavailable Items</span>
                            <h2>{unavailableItems}</h2>
                        </div>

                        <div className="menu-stat-card">
                            <span>Vegetarian Items</span>
                            <h2>{vegetarianItems}</h2>
                        </div>

                    </div>

                    <div className="menu-content-panel">

                        <div className="menu-content-header">

                            <div>
                                <h2>Menu Items</h2>
                                <p>
                                    {filteredItems.length} items displayed
                                </p>
                            </div>

                            <div className="menu-search-box">
                                <Search size={17} />

                                <input
                                    type="text"
                                    placeholder="Search dishes..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="menu-category-filters">

                            {categories.map(category => (
                                <button
                                    type="button"
                                    key={category}
                                    className={
                                        selectedCategory === category
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}

                        </div>

                        {loading ? (

                            <div className="menu-loading">
                                Loading menu items...
                            </div>

                        ) : filteredItems.length === 0 ? (

                            <div className="menu-empty-state">
                                <Utensils size={38} />
                                <h2>No menu items found</h2>
                                <p>
                                    Add your first dish or change your search filter.
                                </p>
                            </div>

                        ) : (

                            <div className="menu-items-grid">

                                {filteredItems.map(item => (

                                    <div
                                        className="menu-item-card"
                                        key={item.id}
                                    >

                                        <div className="menu-item-image">

                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                />
                                            ) : (
                                                <div className="menu-image-placeholder">
                                                    <Utensils size={35} />
                                                </div>
                                            )}

                                            <span
                                                className={
                                                    item.available
                                                        ? "menu-availability available"
                                                        : "menu-availability unavailable"
                                                }
                                            >
                                                {item.available
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </span>

                                        </div>

                                        <div className="menu-item-details">

                                            <div className="menu-item-title-row">

                                                <h3>{item.name}</h3>

                                                <span
                                                    className={
                                                        item.vegetarian
                                                            ? "menu-food-type veg"
                                                            : "menu-food-type non-veg"
                                                    }
                                                    title={
                                                        item.vegetarian
                                                            ? "Vegetarian"
                                                            : "Non-vegetarian"
                                                    }
                                                >
                                                    {item.vegetarian
                                                        ? <Leaf size={14} />
                                                        : "NV"}
                                                </span>

                                            </div>

                                            <p className="menu-item-description">
                                                {item.description || "No description provided."}
                                            </p>

                                            <div className="menu-item-meta">

                                                <span>{item.category}</span>

                                                <strong>
                                                    ₹{Number(item.price).toFixed(2)}
                                                </strong>

                                            </div>

                                            <div className="menu-item-actions">

                                                <button
                                                    type="button"
                                                    onClick={() => handleAvailability(item)}
                                                    title={
                                                        item.available
                                                            ? "Mark unavailable"
                                                            : "Mark available"
                                                    }
                                                >
                                                    {item.available
                                                        ? <EyeOff size={16} />
                                                        : <Eye size={16} />
                                                    }

                                                    {item.available
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="menu-edit-button"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <Pencil size={16} />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="menu-delete-button"
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                </>
            )}


            {showAddModal && (
                <div
                    className="menu-modal-overlay"
                    onClick={() => {
                        if (!saving) setShowAddModal(false);
                    }}
                >
                    <div
                        className="menu-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="menu-modal-header">
                            <div>
                                <span className="menu-eyebrow">
                                    MENU MANAGEMENT
                                </span>
                                <h2>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>

                                <p>
                                    {editingItem
                                        ? "Update your dish information."
                                        : "Add a new dish to your restaurant menu."}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="menu-modal-close"
                                onClick={() => setShowAddModal(false)}
                                disabled={saving}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form
                            className="menu-item-form"
                            onSubmit={handleCreateMenuItem}
                        >
                            {formError && (
                                <div className="menu-error">
                                    {formError}
                                </div>
                            )}

                            <div className="menu-form-group">
                                <label>Dish Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="e.g. Paneer Butter Masala"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    maxLength={150}
                                    required
                                />
                            </div>

                            <div className="menu-form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Describe your delicious dish..."
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    maxLength={1000}
                                    rows={3}
                                />
                            </div>

                            <div className="menu-form-row">
                                <div className="menu-form-group">
                                    <label>Price (₹) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="249.00"
                                        value={formData.price}
                                        onChange={handleFormChange}
                                        min="0.01"
                                        max="99999999.99"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="menu-form-group">
                                    <label>Category *</label>
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="e.g. Main Course"
                                        value={formData.category}
                                        onChange={handleFormChange}
                                        maxLength={100}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="menu-form-group">
                                <label>Image URL</label>
                                <div className="menu-image-url-input">
                                    <ImagePlus size={19} />
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        placeholder="https://example.com/dish.jpg"
                                        value={formData.imageUrl}
                                        onChange={handleFormChange}
                                        maxLength={500}
                                    />
                                </div>
                            </div>

                            {formData.imageUrl.trim() && (
                                <div className="menu-form-image-preview">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Dish preview"
                                    />
                                    <span>Image Preview</span>
                                </div>
                            )}

                            <div className="menu-form-options">
                                <div className="menu-form-group">
                                    <label>Food Type</label>

                                    <select
                                        name="vegetarian"
                                        value={String(formData.vegetarian)}
                                        onChange={e =>
                                            setFormData(previous => ({
                                                ...previous,
                                                vegetarian: e.target.value === "true"
                                            }))
                                        }
                                    >
                                        <option value="true">Vegetarian</option>
                                        <option value="false">Non-Vegetarian</option>
                                    </select>
                                </div>

                                <div className="menu-form-group">
                                    <label>Availability</label>

                                    <select
                                        name="available"
                                        value={String(formData.available)}
                                        onChange={e =>
                                            setFormData(previous => ({
                                                ...previous,
                                                available: e.target.value === "true"
                                            }))
                                        }
                                    >
                                        <option value="true">Available</option>
                                        <option value="false">Unavailable</option>
                                    </select>
                                </div>
                            </div>

                            <div className="menu-modal-actions">
                                <button
                                    type="button"
                                    className="menu-cancel-button"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="menu-save-button"
                                    disabled={saving}
                                >
                                    <Save size={17} />
                                    {saving
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update Menu Item"
                                            : "Save Menu Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StoreIcon() {
    return <Utensils size={38} />;
}
