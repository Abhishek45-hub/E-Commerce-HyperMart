export default function SummaryBar({ sourceCity, destinationCity, summary, isLoading }) {
  return (
    <footer className={isLoading ? "summary-bar is-loading" : "summary-bar"}>
      <div>
        <p className="label">Route</p>
        <h4>
          {sourceCity} → {destinationCity}
        </h4>
      </div>

      <div>
        <p className="label">ETA</p>
        <h4>
          {summary.etaText || "-"}
          {isLoading ? <span className="spinner" aria-label="Calculating route" /> : null}
        </h4>
      </div>

      <div>
        <p className="label">Distance</p>
        <h4>{summary.distanceKm || 0} km</h4>
      </div>

      <div>
        <p className="label">Total Items</p>
        <h4>{summary.totalQuantity || 0}</h4>
      </div>

      <div>
        <p className="label">Total Cost</p>
        <h4>₹{Number(summary.totalCost || 0).toLocaleString("en-IN")}</h4>
      </div>
    </footer>
  );
}
