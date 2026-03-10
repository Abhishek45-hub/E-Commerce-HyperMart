export default function CartModal({
  isOpen,
  items,
  totalItems,
  totalCost,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  destinationCity
}) {
  if (!isOpen) return null;

  return (
    <div className="cart-modal-backdrop" onClick={onClose} role="presentation">
      <section
        className="cart-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-modal-header">
          <h2 id="cart-modal-title">Cart Items</h2>
          <button className="cart-close-btn" onClick={onClose} type="button">
            Close
          </button>
        </header>

        <div className="cart-modal-body">
          {items.length ? (
            items.map((item) => {
              const subtotal = item.costPerUnit * item.quantity;

              return (
                <article key={item.itemNumber} className="cart-item-card">
                  <div className="cart-item-top">
                    <h3>{item.product}</h3>
                    <button
                      type="button"
                      className="cart-delete-btn"
                      onClick={() => onRemove(item.itemNumber)}
                      aria-label={`Remove ${item.product} from cart`}
                    >
                      Delete
                    </button>
                  </div>

                  <p className="cart-item-meta">Price per item: ₹{item.costPerUnit.toLocaleString("en-IN")}</p>
                  <p className="cart-item-meta">Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>
                  <p className="cart-item-meta">
                    From city: <span className="city-highlight">{item.city || "Unknown"}</span>
                  </p>
                  <p className="cart-item-meta">
                    Deliver to: <span className="city-highlight">{destinationCity || "Bangalore"}</span>
                  </p>

                  <div className="cart-qty-controls">
                    <button type="button" onClick={() => onDecrease(item.itemNumber)}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => onIncrease(item.itemNumber)}>
                      +
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="cart-empty">Your cart is empty.</p>
          )}
        </div>

        <footer className="cart-modal-footer">
          <p>Total Items: {totalItems}</p>
          <p>Total Cost: ₹{totalCost.toLocaleString("en-IN")}</p>
        </footer>
      </section>
    </div>
  );
}
