export default function ProductCard({ product, quantity, onChangeQuantity, isPremiumLayout = false }) {
  const outOfStock = !product.inStock;
  const ratingValue = Number.isFinite(product.rating) ? product.rating : null;
  const roundedRating = ratingValue ? Math.round(ratingValue) : 0;
  const stars = Array.from({ length: 5 }, (_, index) => index < roundedRating);

  const handleRipple = (event) => {
    const button = event.currentTarget;
    const existing = button.querySelector(".ripple");

    if (existing) {
      existing.remove();
    }

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  if (isPremiumLayout) {
    return (
      <article className="product-card premium-card">
        <div className="product-content premium-content">
          <p className="premium-price">₹{product.costPerUnit.toLocaleString("en-IN")}</p>
          <h3>{product.product}</h3>
          <p className="premium-description">{product.description}</p>
          {quantity > 0 ? (
            <div className="qty-row">
              <button
                className="qty-btn ripple-btn"
                onMouseDown={handleRipple}
                onClick={() => onChangeQuantity(product.itemNumber, quantity - 1)}
                disabled={outOfStock || quantity <= 0}
              >
                −
              </button>
              <div className="qty-inline" aria-live="polite">
                <span className="qty-label">Quantity:</span>
                <span className="qty-number">{quantity}</span>
              </div>
              <button
                className="qty-btn ripple-btn"
                onMouseDown={handleRipple}
                onClick={() => onChangeQuantity(product.itemNumber, quantity + 1)}
                disabled={outOfStock || quantity >= product.units}
              >
                +
              </button>
            </div>
          ) : (
            <div className="qty-row qty-row-single">
              <button
                className="qty-btn qty-btn-single ripple-btn"
                onMouseDown={handleRipple}
                onClick={() => onChangeQuantity(product.itemNumber, quantity + 1)}
                disabled={outOfStock || quantity >= product.units}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="product-card">
      <div className="product-content">
        <h3>{product.product}</h3>
        <p className="description">{product.description}</p>

        <div className="rating-row" aria-label={ratingValue ? `Rated ${ratingValue} out of 5` : "Not rated"}>
          {ratingValue ? (
            <>
              <span className="stars">
                {stars.map((filled, index) => (
                  <span key={`${product.itemNumber}-star-${index}`} className={filled ? "star filled" : "star"}>
                    ★
                  </span>
                ))}
              </span>
              <span className="rating-text">{ratingValue.toFixed(1)}</span>
            </>
          ) : (
            <span className="rating-text">No rating</span>
          )}
        </div>

        <div className="meta-row">
          <span>₹{product.costPerUnit.toLocaleString("en-IN")}</span>
          <span className={outOfStock ? "stock stock-out" : "stock stock-in"}>
            {outOfStock ? "Out of stock" : `In stock: ${product.units}`}
          </span>
        </div>

        {quantity > 0 ? (
          <div className="qty-row">
            <button
              className="qty-btn ripple-btn"
              onMouseDown={handleRipple}
              onClick={() => onChangeQuantity(product.itemNumber, quantity - 1)}
              disabled={outOfStock || quantity <= 0}
            >
              −
            </button>
            <div className="qty-inline" aria-live="polite">
              <span className="qty-label">Quantity:</span>
              <span className="qty-number">{quantity}</span>
            </div>
            <button
              className="qty-btn ripple-btn"
              onMouseDown={handleRipple}
              onClick={() => onChangeQuantity(product.itemNumber, quantity + 1)}
              disabled={outOfStock || quantity >= product.units}
            >
              +
            </button>
          </div>
        ) : (
          <div className="qty-row qty-row-single">
            <button
              className="qty-btn qty-btn-single ripple-btn"
              onMouseDown={handleRipple}
              onClick={() => onChangeQuantity(product.itemNumber, quantity + 1)}
              disabled={outOfStock || quantity >= product.units}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
