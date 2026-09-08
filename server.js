const bcrypt = require("bcryptjs");
const auth = require("./middleware/auth");
const User = require("./models/User");

//backend server
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const cors = require("cors");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(express.json());
app.use(cors());

/* =========================
   CONNECT DB
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err.message);
  });

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

// =========================
// GET ALL MEMORIES
// =========================

app.get("/memories", auth, async (req, res) => {
  try {
    const memories = await Memory.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(memories);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to fetch memories",
    });
  }
});
app.delete("/memories/:id", auth, async (req, res) => {
  try {
    const memory = await Memory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!memory) {
      return res.status(404).json({
        error: "Memory not found",
      });
    }

    res.json({
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to delete memory",
    });
  }
});
app.delete("/memories/:id", auth, async (req, res) => {
  try {
    const memory = await Memory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!memory) {
      return res.status(404).json({
        error: "Memory not found",
      });
    }

    res.json({
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to delete memory",
    });
  }
});

app.put("/memories/:id", auth, async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || !Array.isArray(value)) {
      return res.status(400).json({
        error: "Memory value must be an array",
      });
    }

    const memory = await Memory.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      {
        value: value,
      },
      {
        new: true,
      },
    );

    if (!memory) {
      return res.status(404).json({
        error: "Memory not found",
      });
    }

    res.json({
      message: "Memory updated successfully",
      memory,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to update memory",
    });
  }
});

app.post("/chat", auth, async (req, res) => {
  try {
    const userMessage = req.body.message;
    const userId = req.user.userId;

    // =========================
    // GET CHAT HISTORY
    // =========================

    const previousChats = await Chat.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const chatHistory = previousChats
      .reverse()
      .map((chat) => `User: ${chat.message}\nAI: ${chat.reply}`)
      .join("\n");

    let aiReply = "";

    // =========================
    // SHOW ALL SAVED MEMORIES
    // =========================

    if (/what do (you|u) know about me/i.test(userMessage)) {
      const memories = await Memory.find({
        userId,
      });

      if (memories.length === 0) {
        aiReply =
          "I don't know much about you yet. Tell me more about yourself! 😊";
      } else {
        let memoryText = "Here's what I know about you:\n\n";

        memories.forEach((memory) => {
          const values = memory.value.join(", ");

          if (memory.key === "name") {
            memoryText += `• Your name is ${values}\n`;
          } else {
            memoryText += `• ${memory.key}: ${values}\n`;
          }
        });

        aiReply = memoryText;
      }
    } else {
      // =========================
      // LOAD EXISTING MEMORIES
      // =========================

      const memories = await Memory.find({
        userId,
      });

      const memoryContext = memories
        .map((memory) => `${memory.key}: ${memory.value.join(", ")}`)
        .join("\n");

      let interaction;
      let lastError;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",

            input: `
You are an AI Digital Twin.

Your personality:
- Be friendly, supportive, and natural.
- Keep responses clear and easy to understand.
- Adapt your response to the user's communication style.
- Be encouraging when helping with learning or coding.
- Do not sound overly formal or robotic.
- Do not pretend to be the user.
- Never claim to have experiences or actions that you do not actually have.

You have two tasks:

1. Respond naturally and helpfully to the user's message.
2. Extract important long-term personal information from the user's message.

Here is what you already know about the user:

${memoryContext}

Recent conversation history:

${chatHistory}

Use this conversation history to understand references and maintain continuity.

Important:
- Do not repeat questions the user has already answered.
- Use previously saved memories naturally when relevant.
- If the user corrects previously known information, prefer the newest information.
- Do not mention that you are reading a database or memory system.
- Respond as the user's AI Digital Twin.

Current user message:

${userMessage}

Return ONLY valid JSON in this format:

{
  "reply": "your response to the user",
  "memories": [
    {
      "key": "name",
      "value": "Preetika"
    },
    {
      "key": "location",
      "value": "Kanpur"
    }
  ]
}

If there is no important personal information to remember:

{
  "reply": "your response to the user",
  "memories": []
}

Rules:

- Reply naturally like a friendly AI assistant.
- Only remember long-term useful personal information.
- Do not remember temporary information, questions, greetings, or general statements.
- Remember facts about the user's identity, preferences, education, location, skills, hobbies, goals, or other long-term interests.
- If the user corrects previously known information, return the corrected value.
- Do not create a memory just because the user mentioned a topic.
- Use lowercase snake_case for memory keys.
- Keep memory values short and factual.
`,

            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: {
                type: "object",
                properties: {
                  reply: {
                    type: "string",
                  },
                  memories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: {
                          type: "string",
                        },
                        value: {
                          type: "string",
                        },
                      },
                      required: ["key", "value"],
                    },
                  },
                },
                required: ["reply", "memories"],
              },
            },
          });

          const aiData = JSON.parse(interaction.output_text);

          aiReply = aiData.reply;

          // Save memory if Gemini found something important
          if (aiData.memories && aiData.memories.length > 0) {
            const allowedMemoryKeys = [
              "name",
              "location",
              "education",
              "skills",
              "hobbies",
              "favorite_food",
              "goals",
              "interests",
            ];

            for (const memory of aiData.memories) {
              const key = memory.key?.toLowerCase().trim();
              const value = memory.value?.trim();

              if (!key || !value) continue;

              if (!allowedMemoryKeys.includes(key)) {
                console.log("Memory rejected:", key);
                continue;
              }

              let existingMemory = await Memory.findOne({
                userId,
                key,
              });

              const replaceKeys = [
                "name",
                "location",
                "education",
                "favorite_food",
              ];

              if (!existingMemory) {
                existingMemory = new Memory({
                  userId,
                  key,
                  value: [value],
                });
              } else {
                if (replaceKeys.includes(key)) {
                  existingMemory.value = [value];
                } else {
                  if (!existingMemory.value.includes(value)) {
                    existingMemory.value.push(value);
                  }
                }
              }

              await existingMemory.save();

              console.log("Memory saved/updated:", key, value);
            }
          }

          // Gemini succeeded, so stop retrying
          break;
        } catch (error) {
          lastError = error;

          console.log(`Gemini attempt ${attempt} failed:`, error.message);

          // Do not retry quota errors
          if (error.status === 429 || error.statusCode === 429) {
            console.log("Gemini quota exceeded. Stopping retries.");
            break;
          }

          // Retry temporary errors
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
        }
      }

      if (!interaction) {
        throw lastError;
      }
    }

    // =========================
    // SAVE CHAT
    // =========================

    const chat = new Chat({
      userId,
      message: userMessage,
      reply: aiReply,
    });

    await chat.save();

    res.json({
      reply: aiReply,
    });
  } catch (err) {
    console.log(err);

    if (err.status === 429 || err.statusCode === 429) {
      return res.status(429).json({
        error: "AI service quota exceeded. Please try again later.",
      });
    }

    res.status(500).json({
      error: "Server error",
    });
  }
});

app.get("/history", auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      userId: req.user.userId,
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.delete("/clear", auth, async (req, res) => {
  try {
    await Chat.deleteMany({
      userId: req.user.userId,
    });

    res.json({
      message: "Your chat history cleared",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to clear chat",
    });
  }
});

// ADD CLEAR MEMORIES ROUTE HERE 👇
app.delete("/clear-memories", auth, async (req, res) => {
  try {
    await Memory.deleteMany({
      userId: req.user.userId,
    });

    res.json({
      message: "All memories cleared successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to clear memories",
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
