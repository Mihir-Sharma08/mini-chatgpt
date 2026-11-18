import mongoose from "mongoose";
import { jsonOptions } from "../utils/jsonOptions.js";

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: "New chat",
    },
  },
  { timestamps: true, toJSON: jsonOptions },
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
