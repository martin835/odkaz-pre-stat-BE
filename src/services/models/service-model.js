import mongoose from "mongoose";
import BasicReview from "./basicReview-model.js";

const { Schema, model } = mongoose;

const ServiceSchema = new Schema(
  {
    type: { type: String, required: true },
    name: { type: String },
    provider: {
      type: mongoose.Types.ObjectId,
      ref: "ClientCenter",
      required: true,
    },
    reviews: [{ type: mongoose.Types.ObjectId, ref: "BasicReview" }],
    description: { type: String },
  },
  { timestamps: true }
);

export default model("Service", ServiceSchema);
