import ProductCard from "./ProductCard";

export default function ProductGrid({ loadingProducts, filteredProducts, cart, onChangeQuantity }) {
  return (
    <section className="cards-grid">
      {loadingProducts
        ? Array.from({ length: 8 }, (_, index) => (
            <div key={`skeleton-${index}`} className="skeleton-card">
              <div className="skeleton-line title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ))
        : filteredProducts.map((product) => (
            <ProductCard
              key={`${product.city}-${product.itemNumber}`}
              product={product}
              quantity={cart[product.itemNumber] || 0}
              onChangeQuantity={onChangeQuantity}
              isPremiumLayout={false}
            />
          ))}
    </section>
  );
}
