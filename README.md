AI Digital Twin

An AI-powered personal chatbot that learns from user-provided information, remembers important details, and uses conversation context to give more personalized responses.

✨ Features

🔐 JWT-based authentication

💬 AI-powered chat with Gemini

🧠 Long-term memory system

🔎 Semantic memory retrieval using embeddings

⭐ Memory importance scoring

✏️ Edit and 🗑️ delete memories

🧹 Deleted-memory protection

📝 Conversation summaries for older context

🎯 Personalized responses based on user preferences

💾 Chat history

📱 Responsive React UI

🛡️ Input validation, rate limiting, Helmet and protected routes

🛠️ Tech Stack

Frontend: React, React Router, ReactMarkdown, CSS
Backend: Node.js, Express.js, Mongoose
Database: MongoDB
AI: Google Gemini API
Authentication: JWT, bcryptjs
AI Memory: Gemini Embeddings + cosine similarity

📂 Project Structure

ai-digital-twin/
├── frontend/
│   └── src/
│       ├── components/
│       └── pages/
│           ├── Chat.jsx
│           ├── Login.jsx
│           ├── Signup.jsx
│           └── Memories.jsx
├── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md

🚀 Getting Started

1. Clone the repository

git clone https://github.com/preetika260606/ai-digital-twin.git
cd ai-digital-twin

2. Install backend dependencies

npm install

3. Configure environment variables

Create a .env file in the project root:

MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret

4. Start the backend

node server.js

Backend:

http://localhost:3000

5. Start the frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

🧠 How Memory Works

The chatbot follows this flow:

User Message
     ↓
Recent Chat History
     ↓
Semantic Memory Search
     ↓
Conversation Summary
     ↓
Gemini
     ↓
Personalized Response
     ↓
Memory Extraction & Storage

User memories are converted into embeddings and matched with the current message using cosine similarity. Relevant memories are then added to the AI context.

🔌 Main API Routes

Method

Endpoint

Purpose

POST

/signup

Create account

POST

/login

Authenticate user

POST

/chat

Send message to AI

GET

/history

Get chat history

DELETE

/clear

Clear chat history

GET

/memories

Get user memories

PUT

/memories/:id

Update memory

DELETE

/memories/:id

Delete memory

DELETE

/clear-memories

Clear stored memories

🔒 Security

Passwords are hashed using bcrypt

JWT protects authenticated routes

Environment secrets are excluded from Git

Request validation is implemented

/chat has rate limiting

Helmet provides security-related HTTP headers

Users can access only their own memories and chats

🎯 Example

User:

My goal is to become a software engineer.

Later:

User:

What should I focus on for my career?

The chatbot can use the stored memory and conversation context to provide a more personalized response.

📌 Future Improvements

Production deployment

Advanced vector database integration

Streaming AI responses

Voice interaction

More advanced personality customization

Analytics dashboard

👩‍💻 Author

Preetika Gupta

GitHub: https://github.com/preetika260606

LinkedIn: https://linkedin.com/in/preetika-gupta-a8613b314

⭐ If you find this project useful, consider giving the repository a star.
