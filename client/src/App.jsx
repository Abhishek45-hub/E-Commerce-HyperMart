import { useEffect, useMemo, useState } from "react";
import { fetchEstimate, fetchMeta, fetchProducts } from "./api/client";
import Navbar from "./components/Navbar";
import StickyFilterBar from "./components/StickyFilterBar";
import ProductGrid from "./components/ProductGrid";
import SummaryBar from "./components/SummaryBar";

const EMPTY_SUMMARY = {
  totalQuantity: 0,
  totalCost: 0,
  etaHours: 0,
  etaText: "No items selected",
  distanceKm: 0,
  unavailableItems: []
};

const THEME_PREFERENCE_KEY = "dashboard-theme-preference";

const getTimeBasedDarkMode = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

const getStoredThemePreference = () => {
  if (typeof window === "undefined") return null;
  const savedPreference = window.localStorage.getItem(THEME_PREFERENCE_KEY);
  return savedPreference === "dark" || savedPreference === "light" ? savedPreference : null;
};

export default function App() {
  const [cities, setCities] = useState([]);
  const [sourceCity, setSourceCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [manualThemePreference, setManualThemePreference] = useState(() => getStoredThemePreference());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedPreference = getStoredThemePreference();
    if (storedPreference) {
      return storedPreference === "dark";
    }
    return getTimeBasedDarkMode();
  });
  const [priceRange, setPriceRange] = useState("all");
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [isCityUpdating, setIsCityUpdating] = useState(false);
  const [isRefreshingCityData, setIsRefreshingCityData] = useState(false);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [lastLoadedSourceCity, setLastLoadedSourceCity] = useState("");
  const [isStickyElevated, setIsStickyElevated] = useState(false);

  const isCityTransitioning = isCityUpdating && (isRefreshingCityData || isEstimating);

  const priceRanges = [
    { id: "all", label: "Filter by price" },
    { id: "10-99", label: "10-99", min: 10, max: 99 },
    { id: "100-499", label: "100-499", min: 100, max: 499 },
    { id: "500-999", label: "500-999", min: 500, max: 999 },
    { id: "1000-5000", label: "1000-5000", min: 1000, max: 5000 }
  ];

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "health-wellness", label: "Health & Wellness" },
    { id: "water-beverage", label: "Water & Beverage" },
    { id: "kitchen-cookware", label: "Kitchen & Cookware" },
    { id: "soaps-personal", label: "Soaps & Personal Care" },
    { id: "hair-care", label: "Hair Care" },
    { id: "deodorants-perfume", label: "Deodorants & Perfumes" },
    { id: "lip-care", label: "Lip Care" },
    { id: "cleaning", label: "Cleaning Products" },
    { id: "food-snacks", label: "Food & Snacks" },
    { id: "food-dairy", label: "Food - Dairy & Cheese" },
    { id: "food-seeds", label: "Food - Seeds & Nuts" },
    { id: "food-grains", label: "Food - Grains & Dal" },
    { id: "food-spices", label: "Food - Spices & Sauces" },
    { id: "food-fruits", label: "Food - Fruits & Vegetables" },
    { id: "baby-products", label: "Baby Products" },
    { id: "kids-products", label: "Kids Products" },
    { id: "health-oils", label: "Health & Wellness Oils" },
    { id: "fragrance", label: "Fragrance & Incense" },
    { id: "pet-products", label: "Pet Products" },
    { id: "household", label: "Household Items" },
    { id: "health-supplements", label: "Health Supplements" },
    { id: "stationery", label: "Stationery" }
  ];

  const getCategoryForProduct = (productName) => {
    const name = productName.toLowerCase();

    if (
      name.includes("soap") ||
      name.includes("sanitizer") ||
      name.includes("face wash") ||
      name.includes("scrub") ||
      name.includes("cream") ||
      name.includes("wipes") ||
      name.includes("multani") ||
      name.includes("balm") ||
      name.includes("sunscreen") ||
      name.includes("cleanser")
    ) {
      return "soaps-personal";
    }

    if (
      name.includes("shampoo") ||
      name.includes("hair") ||
      name.includes("oil") ||
      name.includes("conditioner") ||
      name.includes("serum") ||
      name.includes("henna") ||
      name.includes("color")
    ) {
      return "hair-care";
    }

    if (
      name.includes("deodorant") ||
      name.includes("spray") ||
      name.includes("perfume") ||
      name.includes("eau de") ||
      name.includes("fragrance") ||
      name.includes("freshener")
    ) {
      return "deodorants-perfume";
    }

    if (name.includes("lip")) {
      return "lip-care";
    }

    if (
      name.includes("mop") ||
      name.includes("remover") ||
      name.includes("dishwash") ||
      name.includes("mildew") ||
      name.includes("sheets") ||
      name.includes("handwash")
    ) {
      return "cleaning";
    }

    if (
      name.includes("bottle") ||
      name.includes("water") ||
      name.includes("juice") ||
      name.includes("tea") ||
      name.includes("syrup") ||
      name.includes("drink")
    ) {
      return "water-beverage";
    }

    if (
      name.includes("bowl") ||
      name.includes("glass") ||
      name.includes("container") ||
      name.includes("jar") ||
      name.includes("pan") ||
      name.includes("kadai") ||
      name.includes("cooker") ||
      name.includes("toaster") ||
      name.includes("plate") ||
      name.includes("lunch box") ||
      name.includes("tiffin") ||
      name.includes("casserole") ||
      name.includes("cutter")
    ) {
      return "kitchen-cookware";
    }

    if (
      name.includes("cookie") ||
      name.includes("chocolate") ||
      name.includes("chips") ||
      name.includes("popcorn") ||
      name.includes("toffee") ||
      name.includes("granola") ||
      name.includes("wafer")
    ) {
      return "food-snacks";
    }

    if (name.includes("noodles") || name.includes("soup")) {
      return "food-snacks";
    }

    if (
      name.includes("ghee") ||
      name.includes("cheese") ||
      name.includes("oil") ||
      name.includes("milk")
    ) {
      return "food-dairy";
    }

    if (
      name.includes("seed") ||
      name.includes("nut") ||
      name.includes("peanut") ||
      name.includes("olive")
    ) {
      return "food-seeds";
    }

    if (
      name.includes("dal") ||
      name.includes("quinoa") ||
      name.includes("ragi") ||
      name.includes("dosa")
    ) {
      return "food-grains";
    }

    if (
      name.includes("masala") ||
      name.includes("sauce") ||
      name.includes("chutney") ||
      name.includes("powder") ||
      name.includes("turmeric") ||
      name.includes("spice")
    ) {
      return "food-spices";
    }

    if (
      name.includes("banana") ||
      name.includes("cabbage") ||
      name.includes("chilli") ||
      name.includes("corn") ||
      name.includes("onion") ||
      name.includes("kale") ||
      name.includes("bread") ||
      name.includes("tofu") ||
      name.includes("fruit")
    ) {
      return "food-fruits";
    }

    if (
      name.includes("ice cream") ||
      name.includes("sugarcane")
    ) {
      return "food-fruits";
    }

    if (
      name.includes("diaper") ||
      name.includes("baby") ||
      name.includes("napkin") ||
      name.includes("cereal")
    ) {
      return "baby-products";
    }

    if (
      name.includes("toothbrush") ||
      name.includes("toothpaste") ||
      name.includes("kids") ||
      name.includes("spiderman") ||
      name.includes("barbie")
    ) {
      return "kids-products";
    }

    if (
      name.includes("frankincense") ||
      name.includes("ylang") ||
      name.includes("pain relief") ||
      name.includes("samrakshana") ||
      name.includes("specialist skin")
    ) {
      return "health-oils";
    }

    if (name.includes("incense")) {
      return "fragrance";
    }

    if (
      name.includes("dog") ||
      name.includes("cat") ||
      name.includes("pet") ||
      name.includes("harness")
    ) {
      return "pet-products";
    }

    if (
      name.includes("brush") ||
      name.includes("skewer") ||
      name.includes("umbrella") ||
      name.includes("aerator") ||
      name.includes("bulb")
    ) {
      return "household";
    }

    if (
      name.includes("nutrition") ||
      name.includes("supplement") ||
      name.includes("ayush")
    ) {
      return "health-supplements";
    }

    if (
      name.includes("diary") ||
      name.includes("notebook") ||
      name.includes("pencil") ||
      name.includes("pouch") ||
      name.includes("stationery")
    ) {
      return "stationery";
    }

    if (
      name.includes("garlic") ||
      name.includes("ashwagandha") ||
      name.includes("fenugreek") ||
      name.includes("carom") ||
      name.includes("wheat grass")
    ) {
      return "health-wellness";
    }

    return "all";
  };

  useEffect(() => {
    let active = true;

    fetchMeta()
      .then((data) => {
        if (!active) return;
        const allCities = data.cities || [];
        setCities(allCities);
        setSourceCity(allCities[0] || "");
        setDestinationCity(allCities[2] || allCities[0] || "");
      })
      .catch((err) => setError(err.message));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sourceCity) return;
    const shouldShowSkeleton = !hasLoadedProducts;
    if (shouldShowSkeleton) {
      setLoadingProducts(true);
    }
    setIsRefreshingCityData(true);
    setError("");

    let isMounted = true;

    fetchProducts(sourceCity)
      .then((data) => {
        if (!isMounted) return;
        setProducts(data.products || []);
        setLastLoadedSourceCity(sourceCity);
        setHasLoadedProducts(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message);
        if (isCityUpdating && lastLoadedSourceCity && sourceCity !== lastLoadedSourceCity) {
          setSourceCity(lastLoadedSourceCity);
        }
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingProducts(false);
        setIsRefreshingCityData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sourceCity, hasLoadedProducts, isCityUpdating, lastLoadedSourceCity]);

  const estimatePayload = useMemo(() => {
    const items = Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemNumber, quantity]) => ({ itemNumber: Number(itemNumber), quantity }));

    return { sourceCity, destinationCity, items };
  }, [cart, sourceCity, destinationCity]);

  useEffect(() => {
    if (!sourceCity || !destinationCity) return;

    setIsEstimating(true);

    fetchEstimate(estimatePayload)
      .then((data) => setSummary(data))
      .catch(() => setSummary(EMPTY_SUMMARY))
      .finally(() => setIsEstimating(false));
  }, [estimatePayload, sourceCity, destinationCity]);

  useEffect(() => {
    if (!isCityUpdating) return;
    if (isRefreshingCityData || isEstimating) return;
    setIsCityUpdating(false);
  }, [isCityUpdating, isRefreshingCityData, isEstimating]);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (manualThemePreference) return undefined;

    const syncThemeWithTime = () => {
      setIsDarkMode(getTimeBasedDarkMode());
    };

    syncThemeWithTime();
    const intervalId = window.setInterval(syncThemeWithTime, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [manualThemePreference]);

  useEffect(() => {
    const handleScroll = () => {
      setIsStickyElevated(window.scrollY > 6);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!toast.visible) return undefined;

    const timer = setTimeout(() => {
      setToast({ visible: false, message: "" });
    }, 1600);

    return () => clearTimeout(timer);
  }, [toast.visible]);

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const handleSourceCityChange = (event) => {
    const nextCity = event.target.value;
    if (!nextCity || nextCity === sourceCity) return;

    setError("");
    setIsCityUpdating(true);
    setSourceCity(nextCity);
  };

  const clearCart = () => {
    setCart({});
    setSummary(EMPTY_SUMMARY);
    showToast("Cart cleared!");
  };

  const handleChangeQuantity = (itemNumber, nextQuantity) => {
    setCart((prev) => {
      const quantity = Math.max(0, nextQuantity);
      const previousQuantity = prev[itemNumber] || 0;
      if (quantity === 0) {
        const { [itemNumber]: _, ...rest } = prev;
        return rest;
      }

      if (quantity > previousQuantity) {
        showToast("Item added to cart");
      }
      return { ...prev, [itemNumber]: quantity };
    });
  };

  const handleDarkModeToggle = (event) => {
    const nextIsDark = event.target.checked;
    const nextPreference = nextIsDark ? "dark" : "light";

    setIsDarkMode(nextIsDark);
    setManualThemePreference(nextPreference);
    window.localStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    const range = priceRanges.find((item) => item.id === priceRange);

    return products.filter((product) => {
      const matchesSearch = normalizedSearch
        ? product.product.toLowerCase().includes(normalizedSearch)
        : true;

      const productCategory = getCategoryForProduct(product.product);
      const matchesCategory = selectedCategory === "all" || productCategory === selectedCategory;

      if (!range || range.id === "all") {
        return matchesSearch && matchesCategory;
      }

      const price = Number(product.costPerUnit || 0);
      const meetsMin = range.min !== undefined ? price >= range.min : true;
      const meetsMax = range.max !== undefined ? price <= range.max : true;

      return matchesSearch && matchesCategory && meetsMin && meetsMax;
    });
  }, [products, normalizedSearch, priceRange, priceRanges, selectedCategory]);

  const suggestions = useMemo(() => {
    if (!normalizedSearch) return [];

    const matches = products
      .map((product) => product.product)
      .filter((name) => name.toLowerCase().includes(normalizedSearch));

    return Array.from(new Set(matches)).slice(0, 6);
  }, [products, normalizedSearch]);

  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((total, quantity) => total + Math.max(0, Number(quantity) || 0), 0);
  }, [cart]);

  return (
    <main className="page">
      <div className={isStickyElevated ? "top-controls is-scrolled" : "top-controls"}>
        <div className="sticky-header">
          <Navbar
            cartCount={cartItemCount}
            onClearCart={clearCart}
          />
        </div>

        <StickyFilterBar
          cities={cities}
          sourceCity={sourceCity}
          destinationCity={destinationCity}
          isCityTransitioning={isCityTransitioning}
          onSourceCityChange={handleSourceCityChange}
          onDestinationCityChange={(event) => setDestinationCity(event.target.value)}
          priceRange={priceRange}
          priceRanges={priceRanges}
          onPriceRangeChange={(event) => setPriceRange(event.target.value)}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={(categoryId) => {
            setSelectedCategory(categoryId);
            setShowFilterPanel(false);
            setShowPricePanel(false);
          }}
          showFilterPanel={showFilterPanel}
          onToggleFilterPanel={() => {
            setShowFilterPanel((previous) => !previous);
            setShowPricePanel(false);
          }}
          showPricePanel={showPricePanel}
          onTogglePricePanel={() => {
            setShowPricePanel((previous) => !previous);
            setShowFilterPanel(false);
          }}
          search={search}
          onSearchChange={(event) => setSearch(event.target.value)}
          normalizedSearch={normalizedSearch}
          suggestions={suggestions}
          onSuggestionSelect={setSearch}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleDarkModeToggle}
        />
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loadingProducts ? <p className="status">Loading products...</p> : null}
      {!loadingProducts && normalizedSearch && filteredProducts.length === 0 ? (
        <p className="status">No results found for "{search}"</p>
      ) : null}

      <ProductGrid
        loadingProducts={loadingProducts}
        filteredProducts={filteredProducts}
        cart={cart}
        onChangeQuantity={handleChangeQuantity}
      />

      <SummaryBar
        sourceCity={sourceCity}
        destinationCity={destinationCity}
        summary={summary}
        isLoading={isEstimating}
      />

      <div className={toast.visible ? "toast show" : "toast"}>
        {toast.message}
      </div>
    </main>
  );
}
