const mongoose = require("mongoose");

const conversationSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    summary: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const ConversationSummary = mongoose.model(
  "ConversationSummary",
  conversationSummarySchema
);

module.exports = ConversationSummary;