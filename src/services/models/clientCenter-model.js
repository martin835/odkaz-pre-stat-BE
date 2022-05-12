import mongoose from "mongoose";
import Service from "./service-model.js";

const { Schema, model } = mongoose;

const ClientCenterSchema = new Schema(
  {
    name: { type: String, required: true },
    district: { type: String, required: true },
    services: [{ type: mongoose.Types.ObjectId, ref: "Service" }],
    url: { type: String },
  },
  { timestamps: true }
);

export default model("ClientCenter", ClientCenterSchema);
