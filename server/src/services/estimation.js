import Distance from "../models/Distance.js";
import Inventory from "../models/Inventory.js";

const AVERAGE_SPEED_KMPH = 45;
const BASE_PROCESSING_HOURS = 4;
const PACKING_HOURS_PER_ITEM = 0.15;

export async function buildEstimate({ sourceCity, destinationCity, items }) {
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

  const itemNumbers = validItems.map((item) => Number(item.itemNumber));
  const inventoryRows = await Inventory.find({
    city: sourceCity,
    itemNumber: { $in: itemNumbers }
  }).lean();

  const inventoryMap = new Map(
    inventoryRows.map((row) => [row.itemNumber, row])
  );

  let totalCost = 0;
  let totalQuantity = 0;
  const unavailableItems = [];

  for (const item of validItems) {
    const itemNumber = Number(item.itemNumber);
    const quantity = Number(item.quantity);
    const inventory = inventoryMap.get(itemNumber);

    if (!inventory || inventory.units < quantity) {
      unavailableItems.push({ itemNumber, requested: quantity, available: inventory?.units ?? 0 });
      continue;
    }

    totalCost += quantity * inventory.costPerUnit;
    totalQuantity += quantity;
  }

  const distance = await Distance.findOne({ fromCity: sourceCity, toCity: destinationCity }).lean();
  const distanceKm = distance?.distanceKm ?? 0;

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
