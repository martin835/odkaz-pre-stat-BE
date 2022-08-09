import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ChatSchema = new Schema(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "ChatMessage" }],
  },
  { timestamps: true }
);

//export default model("Chat", ChatSchema);
