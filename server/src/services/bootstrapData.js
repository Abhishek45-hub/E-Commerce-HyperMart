import CatalogProduct from "../models/CatalogProduct.js";
import Inventory from "../models/Inventory.js";
import Distance from "../models/Distance.js";
import { readCsv, readDistanceMatrixCsv, resolveDataFile } from "../utils/csv.js";

export async function bootstrapData(dataDir) {
  const existingInventory = await Inventory.estimatedDocumentCount();
  const existingCatalog = await CatalogProduct.estimatedDocumentCount();
  const existingDistance = await Distance.estimatedDocumentCount();

  if (existingInventory > 0 && existingCatalog > 0 && existingDistance > 0) {
    return;
  }

  const productFile = resolveDataFile(dataDir, "200_products_all_cities.csv");
  const catalogFile = resolveDataFile(dataDir, "BigBasket.csv");
  const distanceFile = resolveDataFile(dataDir, "india_city_distance_matrix.csv");

  const [inventoryRows, catalogRows] = await Promise.all([
    readCsv(productFile),
    readCsv(catalogFile)
  ]);

  const distanceRows = readDistanceMatrixCsv(distanceFile);

  const inventoryOps = inventoryRows.map((row) => {
    const itemNumber = Number(row["Item Number"]);
    const product = row.Product;
    const city = row.City;
    const costPerUnit = Number(row["Cost per unit"]);
    const units = Number(row["No. of units"]);

    return {
      updateOne: {
        filter: { itemNumber, city },
        update: {
          $set: { itemNumber, product, city, costPerUnit, units }
        },
        upsert: true
      }
    };
  });

  const catalogOps = catalogRows.map((row) => {
    const itemNumber = Number(row.index);

    return {
      updateOne: {
        filter: { itemNumber },
        update: {
          $set: {
            itemNumber,
            product: row.product,
            brand: row.brand,
            type: row.type,
            rating: row.rating ? Number(row.rating) : null,
            description: row.description
          }
        },
        upsert: true
      }
    };
  });

  const distanceOps = distanceRows.map((row) => ({
    updateOne: {
      filter: { fromCity: row.fromCity, toCity: row.toCity },
      update: {
        $set: row
      },
      upsert: true
    }
  }));

  if (inventoryOps.length) {
    await Inventory.bulkWrite(inventoryOps, { ordered: false });
  }

  if (catalogOps.length) {
    await CatalogProduct.bulkWrite(catalogOps, { ordered: false });
  }

  if (distanceOps.length) {
    await Distance.bulkWrite(distanceOps, { ordered: false });
  }
}
