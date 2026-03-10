import fs from "fs";
import path from "path";
import csv from "csv-parser";

export function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (rawRow) => {
        const row = {};
        for (const [key, value] of Object.entries(rawRow)) {
          row[key.trim()] = typeof value === "string" ? value.trim() : value;
        }
        rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

export function readDistanceMatrixCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((cell) => cell.trim());
  const toCities = headers.slice(1);

  const distances = [];

  for (let index = 1; index < lines.length; index += 1) {
    const cells = lines[index].split(",").map((cell) => cell.trim());
    const fromCity = cells[0];

    for (let cityIndex = 1; cityIndex < cells.length; cityIndex += 1) {
      const toCity = toCities[cityIndex - 1];
      const value = Number(cells[cityIndex]);

      if (!fromCity || !toCity || Number.isNaN(value)) {
        continue;
      }

      distances.push({
        fromCity,
        toCity,
        distanceKm: value
      });
    }
  }

  return distances;
}

export function resolveDataFile(dataDir, fileName) {
  return path.resolve(dataDir, fileName);
}
