export default function Navbar({
  cartCount,
  onClearCart
}) {
  return (
    <header className="toolbar">
      <div>
        <h1>E commerce - Dashboard</h1>
      </div>

      <div className="selectors">
        <button
          className="clear-cart-btn"
          onClick={onClearCart}
          disabled={cartCount === 0}
          title="Clear all items from cart"
          type="button"
        >
           Clear Cart 🗑️
        </button>
      </div>
    </header>
  );
}
