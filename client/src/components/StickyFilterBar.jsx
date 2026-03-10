export default function StickyFilterBar({
  cities,
  sourceCity,
  destinationCity,
  isCityTransitioning,
  onSourceCityChange,
  onDestinationCityChange,
  priceRange,
  priceRanges,
  onPriceRangeChange,
  categories,
  selectedCategory,
  onCategorySelect,
  showFilterPanel,
  onToggleFilterPanel,
  showPricePanel,
  onTogglePricePanel,
  search,
  onSearchChange,
  normalizedSearch,
  suggestions,
  onSuggestionSelect,
  isDarkMode,
  onToggleDarkMode
}) {
  return (
    <div className="filter-bar-wrapper">
      <div className="filter-bar-row">
        {/* Inventory City */}
        <div className="filter-item">
          <label className="filter-label">
            <span className="filter-label-text">
              Inventory City
              {isCityTransitioning ? (
                <span className="city-update-indicator-inline" aria-live="polite">
                  <span className="spinner-small" aria-hidden="true" />
                </span>
              ) : null}
            </span>
            <select 
              value={sourceCity} 
              onChange={onSourceCityChange} 
              disabled={isCityTransitioning}
              className="filter-select"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Deliver To */}
        <div className="filter-item">
          <label className="filter-label">
            <span className="filter-label-text">Deliver To</span>
            <select 
              value={destinationCity} 
              onChange={onDestinationCityChange}
              className="filter-select"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Search Bar */}
        <div className="filter-item filter-item-search">
          <div className="search-area-inline">
            <input
              id="product-search"
              className="search-input-inline"
              placeholder="Search products..."
              value={search}
              onChange={onSearchChange}
            />

            {normalizedSearch ? (
              <div className="suggestions">
                {suggestions.length ? (
                  suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="suggestion-item"
                      onClick={() => onSuggestionSelect(name)}
                    >
                      {name}
                    </button>
                  ))
                ) : (
                  <p className="no-results">No results</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="filter-dropdown-anchor">
          <button
            className="filter-action-btn"
            onClick={onTogglePricePanel}
            title="Filter by price range"
            type="button"
          >
            Category by Price
          </button>

          {showPricePanel ? (
            <div className="filter-dropdown-panel price-panel">
              {priceRanges.map((range) => (
                <button
                  key={range.id}
                  className={`filter-option ${priceRange === range.id ? "active" : ""}`}
                  onClick={() => {
                    onPriceRangeChange({ target: { value: range.id } });
                    onTogglePricePanel();
                  }}
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="filter-dropdown-anchor">
          <button
            className="filter-action-btn"
            onClick={onToggleFilterPanel}
            title="Filter by category"
            type="button"
          >
            Filter
          </button>

          {showFilterPanel ? (
            <div className="filter-dropdown-panel category-panel">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-option ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => onCategorySelect(cat.id)}
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Dark Mode Toggle */}
        <div className="theme-toggle-inline">
          <span className="theme-label">Dark</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={onToggleDarkMode}
            />
            <span className="toggle-track" />
          </label>
        </div>
      </div>
    </div>
  );
}
