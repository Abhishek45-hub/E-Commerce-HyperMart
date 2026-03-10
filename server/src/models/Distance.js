import mongoose from "mongoose";

const distanceSchema = new mongoose.Schema(
  {
    fromCity: { type: String, required: true, index: true },
    toCity: { type: String, required: true, index: true },
    distanceKm: { type: Number, required: true }
  },
  { timestamps: true }
);

distanceSchema.index({ fromCity: 1, toCity: 1 }, { unique: true });

export default mongoose.model("Distance", distanceSchema);
