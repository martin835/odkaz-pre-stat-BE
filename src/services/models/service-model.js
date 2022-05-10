import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ServiceSchema = new Schema(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    description: { type: String },
    url: { type: String },
  },
  { timestamps: true }
);

export default model("Service", ServiceSchema);
