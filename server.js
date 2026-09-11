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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error.message);
  });
// =========================
// EMBEDDING FUNCTION
// =========================

async function generateEmbedding(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });

  return response.embeddings[0].values;
}

app.use(express.json());
app.use(cors());

// =========================
// COSINE SIMILARITY
// =========================

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// =========================
// GET RELEVANT MEMORIES
// =========================

async function getRelevantMemories(
  userId,
  userMessage,
  limit = 5,
  threshold = 0.7,
  personalization = false,
) {
  const memories = await Memory.find({
    userId,
    embedding: { $exists: true, $ne: [] },
  });

  if (memories.length === 0) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(userMessage);

  const scoredMemories = memories.map((memory) => {
    const similarity = cosineSimilarity(queryEmbedding, memory.embedding);

    const importance = memory.importance ?? 0.5;

    const score = similarity * 0.7 + importance * 0.3;

    return {
      memory,
      similarity,
      importance,
      score,
    };
  });

  console.log(
    "Memory scores:",
    scoredMemories.map((item) => ({
      key: item.memory.key,
      value: item.memory.value,
      similarity: item.similarity,
      importance: item.importance,
      finalScore: item.score,
    })),
  );

  // Keep only memories that are sufficiently relevant
  let relevantMemories;

  if (personalization) {
    relevantMemories = scoredMemories
      .filter((item) => item.similarity >= 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  } else {
    relevantMemories = scoredMemories
      .filter((item) => item.score >= threshold)
      .sort((a, b) => b.score - a.score);
  }

  console.log(
    "Relevant memories:",
    relevantMemories.map((item) => ({
      key: item.memory.key,
      value: item.memory.value,
      score: item.score,
    })),
  );

  return relevantMemories.slice(0, limit).map((item) => item.memory);
}
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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    key: String,
    value: [String],

    importance: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },

    embedding: { type: [Number], default: [] },
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

app.put("/memories/:id", auth, async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || !Array.isArray(value)) {
      return res.status(400).json({
        error: "Memory value must be an array",
      });
    }

    const memory = await Memory.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!memory) {
      return res.status(404).json({
        error: "Memory not found",
      });
    }

    memory.value = value;

    const memoryText = `${memory.key}: ${memory.value.join(", ")}`;

    memory.embedding = await generateEmbedding(memoryText);

    await memory.save();

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
      // SEMANTIC MEMORY RETRIEVAL
      // =========================

      const personalizationKeywords = [
        "what should i",
        "what should i eat",
        "what should i choose",
        "recommend",
        "suggest",
        "which should i",
        "what do you think i should",
        "for me",
        "my preference",
        "my favorite",
      ];

      const needsPersonalization = personalizationKeywords.some((keyword) =>
        userMessage.toLowerCase().includes(keyword),
      );

      const memories = await getRelevantMemories(
        userId,
        userMessage,
        5,
        0.7,
        needsPersonalization,
      );

      let memoryContext = "No relevant memories found.";

      if (memories.length > 0) {
        memoryContext = memories
          .map((memory) => `- ${memory.key}: ${memory.value.join(", ")}`)
          .join("\n");
      }

      // =========================
      // GEMINI AI
      // =========================

      let interaction;
      let lastError;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",

            input: `
You are an AI Digital Twin.

You are the user's personal AI assistant.

Personality:
- Be friendly, supportive, and natural.
- Communicate like a helpful human, not like a robotic system.
- Be clear and concise when the question is simple.
- Give step-by-step explanations when the user is learning something.
- When explaining technical topics, prefer beginner-friendly language.
- Use examples when they make the explanation easier to understand.
- Encourage the user when they are learning or solving problems.
- Adapt your explanation to the user's level of understanding.
- Do not unnecessarily use formal or complicated language.
- Never invent personal information about the user.

User adaptation:
- Adapt the response to the user's apparent level of understanding.
- When the user is learning a technical topic, explain the basics before advanced details when appropriate.
- Use simple language and practical examples for beginners.
- If the user asks for a deeper explanation, increase the level of detail.
- If the user asks for a short answer, keep the response concise.
- Use relevant memories to personalize the response only when they genuinely help answer the current question.
- Never mention a personal memory just to make the response appear personalized.
Relevant memories retrieved from the user's long-term memory:

${memoryContext}

Memory usage rules:

- Use a retrieved memory when it genuinely helps answer the user's current question.
- Prefer memories that are directly related to the user's question or goal.
- When a retrieved memory is directly relevant, actively use it to personalize the answer.
- For recommendations, preferences, or personal advice, prefer the user's relevant stored preferences over generic suggestions.
- If the user asks what they should choose, recommend an option based on their relevant preferences when possible.
- Do not force unrelated memories into the response.
- Do not mention unrelated personal information.
- If multiple memories are relevant, combine them naturally when useful.
- Never reveal the memory system, memory scores, embeddings, or retrieval process to the user.
- Never assume a memory is relevant when the connection is weak.
- Never invent additional personal information based on a memory.
- Do not say that you know something about the user unless it is supported by a retrieved memory.

Recent conversation:
${chatHistory}

Current user message:
${userMessage}

Your tasks:

1. Answer the user's current message naturally.
2. Extract important long-term personal information from the user's message.

Return ONLY valid JSON:

{
  "reply": "your response",
  "memories": [
    {
      "key": "example_key",
      "value": "example value",
      "importance": 0.8
    }
  ]
}

If there is no useful personal information to remember:

{
  "reply": "your response",
  "memories": []
}

Rules:

- Only remember information explicitly stated by the user.
- Do not guess personal information.
- Remember useful long-term information.
- Do not remember greetings or temporary information.
- Do not use a predefined list of memory categories.
- Create a new key when necessary.
- Memory keys must use lowercase snake_case.
- If the user corrects previous information, use the new information.
- Answer the current user message directly.
- Assign an importance score between 0 and 1 to each memory.
- 1 means extremely important and long-term.
- 0.5 means moderately important.
- 0 means not important enough to remember.
- Give higher importance to identity, education, career goals, long-term preferences, and major life goals.
- Give lower importance to temporary or short-lived information.
- Only save information that is useful for future conversations.
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
                        key: { type: "string" },
                        value: { type: "string" },
                        importance: { type: "number" },
                      },

                      required: ["key", "value", "importance"],
                    },
                  },
                },

                required: ["reply", "memories"],
              },
            },
          });

          const aiData = JSON.parse(interaction.output_text);

          aiReply = aiData.reply;

          // =========================
          // SAVE MEMORIES
          // =========================

          if (aiData.memories && aiData.memories.length > 0) {
            for (const memory of aiData.memories) {
              const key = memory.key?.toLowerCase().trim();
              const value = memory.value?.trim();
              const importance = Number(memory.importance);

              if (!key || !value) continue;

              const safeImportance = Math.min(
                1,
                Math.max(0, importance || 0.5),
              );

              let existingMemory = await Memory.findOne({
                userId,
                key,
              });

              // Memories where only the latest value
              // should be stored
              const replaceKeys = [
                "name",
                "location",
                "education",
                "favorite_food",
                "career_goal",
              ];

              // =========================
              // NEW MEMORY
              // =========================

              if (!existingMemory) {
                const memoryText = `${key}: ${value}`;

                const embedding = await generateEmbedding(memoryText);

                existingMemory = new Memory({
                  userId,
                  key,
                  value: [value],
                  importance: safeImportance,
                  embedding,
                });

                await existingMemory.save();

                console.log("New memory saved:", key, value);

                continue;
              }

              // =========================
              // UPDATE EXISTING MEMORY
              // =========================

              let memoryChanged = false;

              if (replaceKeys.includes(key)) {
                if (existingMemory.value[0] !== value) {
                  existingMemory.value = [value];
                  existingMemory.importance = safeImportance;
                  memoryChanged = true;
                } else {
                  existingMemory.importance = safeImportance;

                  await existingMemory.save();

                  console.log(
                    "Duplicate memory found, importance updated:",
                    key,
                    value,
                    safeImportance,
                  );

                  continue;
                }
              } else {
                if (existingMemory.value.includes(value)) {
                  existingMemory.importance = safeImportance;

                  await existingMemory.save();

                  console.log(
                    "Duplicate memory found, importance updated:",
                    key,
                    value,
                    safeImportance,
                  );

                  continue;
                }

                existingMemory.value.push(value);
                existingMemory.importance = safeImportance;
                memoryChanged = true;
              }

              // =========================
              // REGENERATE EMBEDDING
              // =========================

              if (memoryChanged) {
                const memoryText = `${existingMemory.key}: ${existingMemory.value.join(", ")}`;

                existingMemory.embedding = await generateEmbedding(memoryText);
              }

              await existingMemory.save();

              console.log("Memory saved/updated:", key, value);
            }
          }

          // Gemini successful
          break;
        } catch (error) {
          lastError = error;

          console.log(`Gemini attempt ${attempt} failed:`, error.message);

          if (error.status === 429 || error.statusCode === 429) {
            console.log("Gemini quota exceeded. Stopping retries.");

            break;
          }

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
        }
      }

      // =========================
      // CHECK GEMINI RESULT
      // =========================

      if (!interaction) {
        throw lastError;
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
    }

    // =========================
    // SEND RESPONSE
    // =========================

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

// =========================
// CLEAR CHAT
// =========================

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

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
