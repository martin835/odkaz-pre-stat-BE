import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ClientCenterSchema = new Schema(
  {
    name: { type: String, required: true },
    district: { type: String, required: true },
    services: [
      {
        serviceId: { type: mongoose.Types.ObjectId, ref: "Service" },
      },
    ],
    url: { type: String },
  },
  { timestamps: true }
);

export default model("ClientCenter", ClientCenterSchema);
