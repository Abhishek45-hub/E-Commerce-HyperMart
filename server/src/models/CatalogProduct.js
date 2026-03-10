import mongoose from "mongoose";

const catalogProductSchema = new mongoose.Schema(
  {
    itemNumber: { type: Number, required: true, unique: true, index: true },
    product: { type: String, required: true },
    brand: { type: String, default: "" },
    type: { type: String, default: "" },
    rating: { type: Number, default: null },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("CatalogProduct", catalogProductSchema);
