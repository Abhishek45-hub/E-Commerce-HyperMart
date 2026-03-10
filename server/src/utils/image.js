import fs from "fs";
import path from "path";

const KEYWORD_MAP = [
  { match: /water bottle|bottle/i, query: "water-bottle" },
  { match: /oil|capsule|ayurveda/i, query: "essential-oil" },
  { match: /soap|bar/i, query: "soap" },
  { match: /sanitizer|hand wash/i, query: "hand-sanitizer" },
  { match: /shampoo|conditioner/i, query: "shampoo" },
  { match: /container|jar|storage/i, query: "kitchen-storage" },
  { match: /cookies|biscuit/i, query: "cookies" },
  { match: /face wash|skin|cream/i, query: "skincare" },
  { match: /lamp|diya|brass/i, query: "oil-lamp" },
  { match: /scrub|cleaner|mildew|bleach/i, query: "cleaning" },
  { match: /repellent|mosquito/i, query: "mosquito-repellent" },
  { match: /powder|wheat grass|multani/i, query: "herbal-powder" },
  { match: /toothpaste|oral/i, query: "toothpaste" },
  { match: /detergent|laundry/i, query: "laundry" },
  { match: /cleaner|disinfectant/i, query: "disinfectant" }
];

const overridePath = path.resolve(process.cwd(), "imageOverrides.json");
let overrideMap = null;

function loadOverrides() {
  if (overrideMap !== null) return overrideMap;

  if (!fs.existsSync(overridePath)) {
    overrideMap = new Map();
    return overrideMap;
  }

  try {
    const raw = fs.readFileSync(overridePath, "utf8");
    const json = JSON.parse(raw);
    overrideMap = new Map(
      Object.entries(json || {}).map(([key, value]) => [key.toLowerCase(), value])
    );
  } catch {
    overrideMap = new Map();
  }

  return overrideMap;
}

export function getProductImageUrl({ productName, description, itemNumber }) {
  const overrides = loadOverrides();
  const itemKey = String(itemNumber || "").toLowerCase();
  const nameKey = String(productName || "").toLowerCase();

  if (overrides.has(itemKey)) {
    return overrides.get(itemKey);
  }

  if (overrides.has(nameKey)) {
    return overrides.get(nameKey);
  }

  const name = String(productName || "product");
  const combinedText = `${name} ${description || ""}`;
  const match = KEYWORD_MAP.find((entry) => entry.match.test(combinedText));
  const fallback = name.split(" ").slice(0, 3).join(" ");
  const keyword = encodeURIComponent(match ? match.query : fallback);

  return `https://picsum.photos/seed/${keyword}-${itemNumber}/300/200`;
}
