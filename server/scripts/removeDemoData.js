import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import User from "../src/models/User.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";

async function main() {
  await mongoose.connect(env.mongodbUri);

  const demoUser = await User.findOne({ email: "demo@example.com" });
  if (!demoUser) {
    console.log("No demo user found. Nothing to remove.");
    return;
  }

  const conversations = await Conversation.find({ userId: demoUser._id }).select("_id");
  const conversationIds = conversations.map((conversation) => conversation._id);

  const messages = await Message.deleteMany({ conversationId: { $in: conversationIds } });
  const removedConversations = await Conversation.deleteMany({ userId: demoUser._id });
  await User.deleteOne({ _id: demoUser._id });

  console.log(
    `Removed demo user, ${removedConversations.deletedCount} conversations and ${messages.deletedCount} messages.`,
  );
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());