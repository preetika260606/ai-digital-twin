require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

app.use(express.json());

// CONNECT DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// CHAT SCHEMA
const chatSchema = new mongoose.Schema({
  message: String,
  reply: String,
});
const Chat = mongoose.model("Chat", chatSchema);

// MEMORY SCHEMA ✅ (MOVE UP)
const memorySchema = new mongoose.Schema({
  key: String,
  value: String,
});
const Memory = mongoose.model("Memory", memorySchema);

// ROUTE

app.get("/", (req, res) => {
  res.send("Server working");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const lowerMessage = userMessage.toLowerCase();

    console.log("User said:", userMessage);
    console.log("Lower:", lowerMessage);

    let aiReply = "Hello from AI";

    // 👉 STORE NAME
    if (/my name is/i.test(userMessage)) {
      const parts = userMessage.split(/my name is/i);

      if (parts.length > 1) {
        const name = parts[1].trim();

        // ✅ SAVE NAME HERE
        await Memory.findOneAndUpdate(
          { key: "name" },
          { value: name },
          { upsert: true },
        );

        aiReply = `Nice to meet you, ${name}!`;
      }
    }

    // 👉 STORE LIKES
    else if (/i like (.+)/i.test(userMessage)) {
      const match = userMessage.match(/i like (.+)/i);

      if (match && match[1]) {
        const like = match[1].trim();

        await Memory.findOneAndUpdate(
          { key: "like" },
          { value: like },
          { upsert: true },
        );

        aiReply = `Got it! You like ${like} 😄`;
      }
    }

    // 👉 USE SAVED NAME
    // 👉 USE MEMORY
    else {
      const savedName = await Memory.findOne({ key: "name" });
      const savedLike = await Memory.findOne({ key: "like" });

      if (savedName && savedLike) {
        aiReply = `Hey ${savedName.value}! I remember you like ${savedLike.value} 😄`;
      } else if (savedName) {
        aiReply = `Hey ${savedName.value}!`;
      } else {
        aiReply = "Hello from AI";
      }
    }

    // SAVE CHAT
    const chat = new Chat({
      message: userMessage,
      reply: aiReply,
    });

    await chat.save();

    res.json({ reply: aiReply });
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// SERVER
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
