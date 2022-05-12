import mongoose from "mongoose";

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String },
    password: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      required: true,
      enum: ["admin", "serviceProvider", "basicUser"],
      default: "basicUser",
    },
    reviews: [
      {
        type: mongoose.Types.ObjectId,
        ref: "BasicReview",
      },
    ],
  },
  { timestamps: true }
);

export default model("User", UserSchema);
