import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import TypingIndicator from "../components/TypingIndicator";

function Chat() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      const formattedMessages = [];

      data.forEach((chat) => {
        formattedMessages.push({
          sender: "user",
          text: chat.message,
        });

        formattedMessages.push({
          sender: "ai",
          text: chat.reply,
        });
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.log(error);
    }
  };

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  const clearChat = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to start a new chat?",
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      await fetch("http://localhost:3000/clear", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages([]);
    } catch (error) {
      console.log(error);
    }
  };
  const clearMemories = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch("http://localhost:3000/clear-memories", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Memories cleared successfully!");
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    // Show user's message immediately
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      // Backend returned an error
      if (!response.ok) {
        console.log("Chat API Error:", data);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `⚠️ ${
              data.error || "Something went wrong. Please try again."
            }`,
            isError: true,
          },
        ]);

        return;
      }

      // Successful AI response
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply,
        },
      ]);
    } catch (error) {
      console.log("Network Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ Unable to connect to the server. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm">
        {/* Logo + User */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center text-xl shadow-sm">
            🧠
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Digital Twin</h1>

            <p className="text-sm text-gray-500">Welcome {user?.name} 👋</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate("/memories")}
            className="px-3.5 py-2 rounded-lg border border-gray-200
                 text-sm font-medium text-gray-700
                 hover:bg-gray-50 hover:border-gray-300
                 transition"
          >
            🧠 Memories
          </button>

          <button
            onClick={clearChat}
            className="px-3.5 py-2 rounded-lg border border-gray-200
                 text-sm font-medium text-gray-700
                 hover:bg-gray-50 hover:border-gray-300
                 transition"
          >
            ＋ New Chat
          </button>

          <button
            onClick={clearMemories}
            className="px-3.5 py-2 rounded-lg border border-gray-200
                 text-sm font-medium text-gray-700
                 hover:bg-gray-50 hover:border-gray-300
                 transition"
          >
            Clear Memories
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-lg bg-black text-white
                 text-sm font-medium
                 hover:bg-gray-800
                 transition shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {/* EMPTY / WELCOME SCREEN */}
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center px-4 py-10">
            <div className="text-center max-w-2xl w-full">
              {/* AI ICON */}
              <div
                className="w-20 h-20 bg-black text-white rounded-3xl
                   flex items-center justify-center
                   text-4xl mx-auto mb-6
                   shadow-lg"
              >
                🧠
              </div>

              {/* TITLE */}
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                How can I help you today?
              </h2>

              {/* DESCRIPTION */}
              <p
                className="text-gray-500 text-sm sm:text-base
                    max-w-xl mx-auto mb-8 leading-relaxed"
              >
                I'm your AI Digital Twin. I can remember your preferences,
                understand your conversations, and give personalized responses.
              </p>

              {/* FEATURE CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CHAT CARD */}
                <div
                  className="bg-white border border-gray-200 rounded-2xl
                     p-5 text-left
                     hover:shadow-md hover:-translate-y-1
                     transition duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-gray-100
                          flex items-center justify-center
                          text-lg mb-4"
                  >
                    💬
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">Chat</h3>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ask questions and have a natural conversation.
                  </p>
                </div>

                {/* MEMORY CARD */}
                <div
                  className="bg-white border border-gray-200 rounded-2xl
                     p-5 text-left
                     hover:shadow-md hover:-translate-y-1
                     transition duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-gray-100
                          flex items-center justify-center
                          text-lg mb-4"
                  >
                    🧠
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">Memory</h3>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    Your important preferences and information can be
                    remembered.
                  </p>
                </div>

                {/* PERSONALIZED CARD */}
                <div
                  className="bg-white border border-gray-200 rounded-2xl
                     p-5 text-left
                     hover:shadow-md hover:-translate-y-1
                     transition duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-xl bg-gray-100
                          flex items-center justify-center
                          text-lg mb-4"
                  >
                    ✨
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">
                    Personalized
                  </h3>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    Get responses based on your conversation and memories.
                  </p>
                </div>
              </div>

              {/* SMALL HINT */}
              <p className="text-xs text-gray-400 mt-8">
                Start by saying something like "Tell me about myself"
              </p>
            </div>
          </div>
        )}
        {/* MESSAGES */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-3 mb-6 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* AI AVATAR */}
            {msg.sender === "ai" && (
              <div
                className="w-9 h-9 rounded-full bg-black text-white
                   flex items-center justify-center
                   text-sm shrink-0 shadow-sm"
              >
                🧠
              </div>
            )}

            {/* MESSAGE */}
            <div
              className={`max-w-[75%] sm:max-w-[70%]
    px-5 py-3.5
    rounded-2xl
    shadow-sm
    break-words
    leading-relaxed
  ${
    msg.sender === "user"
      ? "bg-black text-white rounded-br-md"
      : msg.isError
        ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-md"
        : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
  }`}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),

                  ul: ({ children }) => (
                    <ul className="list-disc ml-5 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="list-decimal ml-5 mb-3 space-y-1">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),

                  code({ inline, className, children, ...props }) {
                    return inline ? (
                      <code
                        className={`px-1.5 py-0.5 rounded text-sm ${
                          msg.sender === "user"
                            ? "bg-gray-800 text-gray-100"
                            : "bg-gray-100 text-gray-800"
                        }`}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <pre
                        className="bg-gray-900 text-gray-100
                           p-4 rounded-xl
                           overflow-x-auto
                           my-3 text-sm"
                      >
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>

            {/* USER AVATAR */}
            {msg.sender === "user" && (
              <div
                className="w-9 h-9 rounded-full
                   bg-gray-200
                   flex items-center justify-center
                   text-sm shrink-0 shadow-sm"
              >
                👤
              </div>
            )}
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* INPUT BOX */}
          <div
            className="flex items-center gap-2
                 bg-gray-50
                 border border-gray-200
                 rounded-2xl
                 p-2
                 shadow-sm
                 focus-within:bg-white
                 focus-within:border-gray-300
                 focus-within:shadow-md
                 transition"
          >
            {/* TEXT INPUT */}
            <input
              type="text"
              placeholder="Message your AI Digital Twin..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  sendMessage();
                }
              }}
              disabled={loading}
              className="flex-1
                   bg-transparent
                   px-4 py-3
                   outline-none
                   text-sm sm:text-base
                   text-gray-900
                   placeholder-gray-400
                   disabled:cursor-not-allowed"
            />

            {/* SEND BUTTON */}
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className={`w-11 h-11
                    rounded-xl
                    flex items-center justify-center
                    font-semibold
                    text-lg
                    transition
                    ${
                      loading || !input.trim()
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95"
                    }`}
            >
              {loading ? "..." : "↑"}
            </button>
          </div>

          {/* HINT */}
          <p className="text-center text-xs text-gray-400 mt-2">
            Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}

export default Chat; //this is the code
