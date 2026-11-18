import mongoose from "mongoose";
import { jsonOptions } from "../utils/jsonOptions.js";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 20000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: jsonOptions },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
