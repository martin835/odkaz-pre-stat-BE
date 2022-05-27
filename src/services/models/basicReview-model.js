import mongoose from "mongoose";
import Service from "./service-model.js";

const { Schema, model } = mongoose;

const BasicReviewSchema = new Schema(
  {
    rating: { type: Number, required: true },
    review: { type: String },
    service: { type: mongoose.Types.ObjectId, required: true, ref: "Service" }, //  which service I am reviewing
    provider: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "ClientCenter",
    },
    user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    comments: [
      {
        comment: { type: String, required: true },
        userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
        commentDate: { type: Date, required: true },
        commentLikes: [
          {
            userId: { type: mongoose.Types.ObjectId, ref: "User" },
            _id: false,
          },
        ],
      },
    ],
    likes: [
      {
        userId: { type: mongoose.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

export default model("BasicReview", BasicReviewSchema);
