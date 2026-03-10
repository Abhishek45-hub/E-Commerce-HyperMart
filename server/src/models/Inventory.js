import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    itemNumber: { type: Number, required: true, index: true },
    product: { type: String, required: true },
    city: { type: String, required: true, index: true },
    costPerUnit: { type: Number, required: true },
    units: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

inventorySchema.index({ itemNumber: 1, city: 1 }, { unique: true });

export default mongoose.model("Inventory", inventorySchema);
