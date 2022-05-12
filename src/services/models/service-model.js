import mongoose from "mongoose";

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
    description: { type: String },
  },
  { timestamps: true }
);

export default model("Service", ServiceSchema);
