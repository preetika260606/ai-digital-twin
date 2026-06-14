const bcrypt = require("bcryptjs");
const auth = require("./middleware/auth");
const User = require("./models/User");

//backend server
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const OpenAI = require("openai");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const cors = require("cors");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.use(cors());

/* =========================
   CONNECT DB
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* =========================
   CHAT SCHEMA
========================= */

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    message: String,

    reply: String,
  },
  { timestamps: true },
);

const Chat = mongoose.model("Chat", chatSchema);

/* =========================
   MEMORY SCHEMA
========================= */

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    key: String,

    value: [String],
  },
  { timestamps: true },
);

const Memory = mongoose.model("Memory", memorySchema);

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.send("Server working");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const authHeader = req.header("Authorization");

    let userId = null;

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      userId = decoded.userId;
    }

    let aiReply = "Hello from AI";
    // STORE NAME
    if (/my name is/i.test(userMessage)) {
      const parts = userMessage.split(/my name is/i);

      if (parts.length > 1) {
        const name = parts[1].trim();

        await Memory.findOneAndUpdate(
          {
            userId,
            key: "name",
          },
          {
            userId,
            value: [name],
          },
          {
            upsert: true,
            returnDocument: "after",
          },
        );
        aiReply = `Nice to meet you, ${name}!`;
      }
    }

    // STORE LIKES
    else if (/i like (.+)/i.test(userMessage)) {
      const match = userMessage.match(/i like (.+)/i);

      if (match && match[1]) {
        const like = match[1].trim();

        let existingLikes = await Memory.findOne({
          userId,
          key: "like",
        });

        if (!existingLikes) {
          existingLikes = new Memory({
            key: "like",
            value: [like],
          });
        } else {
          if (!existingLikes.value.includes(like)) {
            existingLikes.value.push(like);
          }
        }

        await existingLikes.save();

        aiReply = `Got it! You like ${like} 😄`;
      }
    }

    // USE MEMORY
    // USE MEMORY + OPENAI
    else {
      const savedName = await Memory.findOne({
        userId,
        key: "name",
      });

      const savedLike = await Memory.findOne({
        userId,
        key: "like",
      });

      const memoryContext = `
User name: ${savedName?.value?.[0] || ""}
Likes: ${savedLike?.value?.join(", ") || ""}
`;

      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a friendly AI assistant.

Memory:
${memoryContext}
          `,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
        });

        aiReply = completion.choices[0].message.content;
      } catch (error) {
        console.log("OpenAI Error:", error.message);

        // FALLBACK RESPONSE
        if (savedName && savedLike) {
          aiReply = `Hey ${savedName.value[0]}! I still remember you like ${savedLike.value.join(", ")} 😄`;
        } else if (savedName) {
          aiReply = `Hey ${savedName.value[0]}!`;
        } else {
          aiReply = "AI service is temporarily unavailable.";
        }
      }
    }

    // SAVE CHAT
    const chat = new Chat({
      userId,
      message: userMessage,
      reply: aiReply,
    });

    await chat.save();

    res.json({ reply: aiReply });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/history", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.delete("/clear", async (req, res) => {
  try {
    await Chat.deleteMany({});

    res.json({
      message: "Chat history cleared",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to clear chat",
    });
  }
});

/* =========================
   SIGNUP
========================= */

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* =========================
   Login route
========================= */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
