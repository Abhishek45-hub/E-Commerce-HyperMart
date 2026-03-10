# MERN One-Page E-Commerce Dashboard

This project implements a professional single-page dashboard using your 3 CSV datasets and MongoDB (`mongodb://localhost:27017/`).

## What it does

- Loads product inventory by city from `200_products_all_cities.csv`.
- Loads product descriptions from `BigBasket.csv`.
- Loads city-distance matrix from `india_city_distance_matrix.csv`.
- Imports/uses online product images (Unsplash source URLs).
- Shows products in card layout with:
  - image
  - title
  - description
  - unit price
  - stock / out-of-stock status
  - add/deduct quantity buttons
- Recalculates **Total Cost** and **ETA** on every quantity change via API calls.

## Architecture blueprint

### 1) Data layer (MongoDB)

Collections:

- `inventories` (city-wise stock + cost)
- `catalogproducts` (description/brand/type/rating)
- `distances` (fromCity, toCity, distanceKm)

On server startup:

1. Connect to MongoDB.
2. If DB is empty, parse and upsert all 3 CSV datasets.

### 2) API layer (Express)

- `GET /api/meta`
  - returns cities for dropdowns.

- `GET /api/products?city=Bengaluru`
  - returns products for selected inventory city with merged description + image + stock status.

- `POST /api/estimate`
  - input:
    ```json
    {
      "sourceCity": "Delhi",
      "destinationCity": "Bengaluru",
      "items": [{ "itemNumber": 1, "quantity": 2 }]
    }
    ```
  - output:
    - `totalQuantity`
    - `totalCost`
    - `distanceKm`
    - `etaHours`
    - `etaText`
    - `unavailableItems`

### 3) Frontend layer (React single-page)

Top:
- page title + city selectors (`Inventory City`, `Deliver To`)
- card grid of products

Bottom:
- sticky summary bar with route, ETA, distance, total items, and total cost

Live update flow:
1. User clicks `+` / `-` on quantity in card.
2. Frontend sends current cart to `/api/estimate`.
3. ETA and cost update immediately.

## ETA and cost calculation methods

### Current implementation (Method A: deterministic distance + handling model)

- `totalCost = Σ (quantity_i × costPerUnit_i)`
- `distanceKm = matrix[sourceCity][destinationCity]`
- `travelHours = distanceKm / averageSpeedKmph`
- `packingHours = min(12, totalQuantity × 0.15)`
- `etaHours = ceil((baseProcessingHours + travelHours + packingHours) × bufferFactor)`

Current constants in code:

- `averageSpeedKmph = 45`
- `baseProcessingHours = 4`
- `bufferFactor = 1.1` (or `1.2` for long routes >1000 km)

### Alternative Method B: SLA bucket model

- Distance buckets map directly to SLA:
  - 0–300 km → same day
  - 301–900 km → next day
  - 901+ km → 2–3 days
- Add fixed handling surcharge for large carts.

### Alternative Method C: hybrid confidence model

- `eta = weighted( historicalAvgEtaByRoute, ruleBasedEta )`
- Better for production once order-history data exists.

### Cost enhancements you can add

- Delivery fee by distance slab.
- Surge factor by demand window.
- Discount tiers by total quantity.

## Out-of-stock behavior

- Product card shows **Out of stock** if `units <= 0`.
- `+/-` controls are disabled for unavailable items.

## How to run

## 1) Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

## 2) Frontend

```bash
cd client
npm install
npm run dev
```

Open: `http://localhost:5173`

## Folder structure

- `server/src/index.js` - API + bootstrap
- `server/src/services/bootstrapData.js` - CSV to Mongo
- `server/src/services/estimation.js` - ETA/cost engine
- `client/src/App.jsx` - one-page dashboard
- `client/src/components/ProductCard.jsx` - product cards
- `client/src/components/SummaryBar.jsx` - bottom ETA/cost bar
