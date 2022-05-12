import mongoose from "mongoose";

const { Schema, model } = mongoose;

const BasicReviewSchema = new Schema(
  {
    rating: { type: Number, required: true },
    review: { type: String },
    service: { type: mongoose.Types.ObjectId }, //  which service I am reviewing
    user: { type: mongoose.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default model("BasicReview", BasicReviewSchema);
