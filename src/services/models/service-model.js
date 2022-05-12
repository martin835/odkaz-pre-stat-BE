import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ServiceSchema = new Schema(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    description: { type: String },
    clientCenters: [
      {
        clientCenterId: { type: mongoose.Types.ObjectId, ref: "ClientCenter" },
      },
    ],
  },
  { timestamps: true }
);

export default model("Service", ServiceSchema);
