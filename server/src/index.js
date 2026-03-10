import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Inventory from "./models/Inventory.js";
import Distance from "./models/Distance.js";
import { bootstrapData } from "./services/bootstrapData.js";
import { buildEstimate } from "./services/estimation.js";
import { getProductImageUrl } from "./utils/image.js";
import { readCsv, readDistanceMatrixCsv, resolveDataFile } from "./utils/csv.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce_dashboard";
const DATA_DIR = path.resolve(__dirname, process.env.DATA_DIR || "../../");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const OPEN_BROWSER = String(process.env.OPEN_BROWSER || "true").toLowerCase() !== "false";
const MAX_PORT_RETRIES = Number(process.env.MAX_PORT_RETRIES || 20);

const cache = {
  inventory: [],
  catalogByItem: new Map(),
  distanceByRoute: new Map(),
  cities: []
};

function isCacheMode() {
  return app.locals.cacheMode === true;
}

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/", (_, res) => {
  res.redirect(FRONTEND_URL);
});

app.get("/api/meta", async (_, res) => {
  if (isCacheMode()) {
    return res.json({ cities: cache.cities });
  }

  const cities = await Inventory.distinct("city");
  return res.json({ cities: cities.sort() });
});

app.get("/api/products", async (req, res) => {
  const city = String(req.query.city || "").trim();

  if (!city) {
    return res.status(400).json({ message: "city query param is required" });
  }

  if (isCacheMode()) {
    const rows = cache.inventory.filter((item) => item.city === city);
    const products = rows.map((item) => {
      const catalog = cache.catalogByItem.get(item.itemNumber) || {};

      return {
        ...item,
        description: catalog.description || "No description available",
        brand: catalog.brand || "",
        rating: catalog.rating ?? null,
          imageUrl: getProductImageUrl({
            productName: item.product,
            description: catalog.description || "No description available",
            itemNumber: item.itemNumber
          }),
        inStock: item.units > 0
      };
    });

    return res.json({ products });
  }

  const rows = await Inventory.aggregate([
    { $match: { city } },
    {
      $lookup: {
        from: "catalogproducts",
        localField: "itemNumber",
        foreignField: "itemNumber",
        as: "catalog"
      }
    },
    {
      $unwind: {
        path: "$catalog",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 0,
        itemNumber: 1,
        city: 1,
        product: 1,
        costPerUnit: 1,
        units: 1,
        description: { $ifNull: ["$catalog.description", "No description available"] },
        brand: { $ifNull: ["$catalog.brand", ""] },
        rating: { $ifNull: ["$catalog.rating", null] }
      }
    },
    { $sort: { itemNumber: 1 } }
  ]);

  const products = rows.map((item) => ({
    ...item,
      imageUrl: getProductImageUrl({
        productName: item.product,
        description: item.description,
        itemNumber: item.itemNumber
      }),
    inStock: item.units > 0
  }));

  return res.json({ products });
});

app.post("/api/estimate", async (req, res) => {
  const { sourceCity, destinationCity, items } = req.body || {};

  if (!sourceCity || !destinationCity || !Array.isArray(items)) {
    return res.status(400).json({
      message: "sourceCity, destinationCity and items are required"
    });
  }

  if (isCacheMode()) {
    const estimate = buildEstimateFromCache({
      sourceCity: String(sourceCity).trim(),
      destinationCity: String(destinationCity).trim(),
      items
    });

    return res.json(estimate);
  }

  const estimate = await buildEstimate({
    sourceCity: String(sourceCity).trim(),
    destinationCity: String(destinationCity).trim(),
    items
  });

  return res.json(estimate);
});

function buildEstimateFromCache({ sourceCity, destinationCity, items }) {
  const AVERAGE_SPEED_KMPH = 45;
  const BASE_PROCESSING_HOURS = 4;
  const PACKING_HOURS_PER_ITEM = 0.15;
  const validItems = items.filter((item) => Number(item.quantity) > 0);

  if (!validItems.length) {
    return {
      totalQuantity: 0,
      totalCost: 0,
      etaHours: 0,
      etaText: "No items selected",
      distanceKm: 0,
      unavailableItems: []
    };
  }

  const inventoryByItem = new Map(
    cache.inventory
      .filter((row) => row.city === sourceCity)
      .map((row) => [row.itemNumber, row])
  );

  let totalCost = 0;
  let totalQuantity = 0;
  const unavailableItems = [];

  for (const item of validItems) {
    const itemNumber = Number(item.itemNumber);
    const quantity = Number(item.quantity);
    const inventory = inventoryByItem.get(itemNumber);

    if (!inventory || inventory.units < quantity) {
      unavailableItems.push({ itemNumber, requested: quantity, available: inventory?.units ?? 0 });
      continue;
    }

    totalCost += quantity * inventory.costPerUnit;
    totalQuantity += quantity;
  }

  const distanceKey = `${sourceCity}||${destinationCity}`;
  const distanceKm = cache.distanceByRoute.get(distanceKey) ?? 0;
  const travelHours = distanceKm / AVERAGE_SPEED_KMPH;
  const packingHours = Math.min(12, totalQuantity * PACKING_HOURS_PER_ITEM);
  const bufferFactor = distanceKm > 1000 ? 1.2 : 1.1;
  const etaHours = Math.ceil((BASE_PROCESSING_HOURS + travelHours + packingHours) * bufferFactor);

  return {
    totalQuantity,
    totalCost,
    etaHours,
    etaText: formatEta(etaHours),
    distanceKm,
    unavailableItems
  };
}

function formatEta(hours) {
  if (hours <= 0) {
    return "No items selected";
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  if (days === 0) {
    return `${remHours}h`;
  }

  if (remHours === 0) {
    return `${days}d`;
  }

  return `${days}d ${remHours}h`;
}

function openBrowser(url) {
  try {
    if (process.platform === "win32") {
      const child = spawn("cmd", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      return;
    }

    const opener = process.platform === "darwin" ? "open" : "xdg-open";
    const child = spawn(opener, [url], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
  } catch (error) {
    console.warn(`Could not open browser automatically: ${error.message}`);
  }
}

function listenWithRetry(startPort, retriesLeft) {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(startPort, () => resolve({ server, port: startPort }))
      .on("error", (error) => {
        if (error.code === "EADDRINUSE" && retriesLeft > 0) {
          console.warn(`Port ${startPort} is in use. Retrying on ${startPort + 1}...`);
          return resolve(listenWithRetry(startPort + 1, retriesLeft - 1));
        }

        return reject(error);
      });
  });
}

async function start() {
  app.locals.cacheMode = false;

  try {
    await mongoose.connect(MONGODB_URI);
    await bootstrapData(DATA_DIR);

    const allCities = await Distance.distinct("fromCity");
    console.log(`Distance matrix loaded for ${allCities.length} cities.`);
  } catch (error) {
    console.error("MongoDB unavailable. Falling back to CSV-only mode.", error.message);
    app.locals.cacheMode = true;
    await loadCsvCache();
  }

  const { port } = await listenWithRetry(PORT, MAX_PORT_RETRIES);
  const serverUrl = `http://localhost:${port}`;
  console.log(`Server listening on ${serverUrl}`);
  console.log(`Root path redirects to ${FRONTEND_URL}`);

  if (OPEN_BROWSER) {
    openBrowser(serverUrl);
  }
}

start().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});

async function loadCsvCache() {
  const productFile = resolveDataFile(DATA_DIR, "200_products_all_cities.csv");
  const catalogFile = resolveDataFile(DATA_DIR, "BigBasket.csv");
  const distanceFile = resolveDataFile(DATA_DIR, "india_city_distance_matrix.csv");

  const [inventoryRows, catalogRows] = await Promise.all([
    readCsv(productFile),
    readCsv(catalogFile)
  ]);

  const distanceRows = readDistanceMatrixCsv(distanceFile);

  cache.inventory = inventoryRows.map((row) => ({
    itemNumber: Number(row["Item Number"]),
    product: row.Product,
    city: row.City,
    costPerUnit: Number(row["Cost per unit"]),
    units: Number(row["No. of units"])
  }));

  cache.catalogByItem = new Map(
    catalogRows.map((row) => [
      Number(row.index),
      {
        product: row.product,
        brand: row.brand,
        type: row.type,
        rating: row.rating ? Number(row.rating) : null,
        description: row.description
      }
    ])
  );

  cache.distanceByRoute = new Map(
    distanceRows.map((row) => [
      `${row.fromCity}||${row.toCity}`,
      row.distanceKm
    ])
  );

  cache.cities = Array.from(new Set(cache.inventory.map((row) => row.city))).sort();
  console.log(`CSV cache loaded for ${cache.cities.length} cities.`);
}
