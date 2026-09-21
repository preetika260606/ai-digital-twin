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

        let errorMessage = "Something went wrong. Please try again.";

        if (response.status === 400) {
          errorMessage =
            "⚠️ Invalid message. Please check your input and try again.";
        } else if (response.status === 401) {
          errorMessage = "⚠️ Your session has expired. Please log in again.";
        } else if (response.status === 429) {
          errorMessage =
            "⚠️ Too many requests. Please wait a moment and try again.";
        } else if (response.status >= 500) {
          errorMessage =
            "⚠️ The server is temporarily unavailable. Please try again shortly.";
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: errorMessage,
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
      {/* HEADER */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* BRAND */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center text-xl shadow-sm">
              🧠
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">
                AI Digital Twin
              </h1>

              <p className="text-xs text-gray-500">
                Welcome {user?.name || "there"} 👋
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Memories */}
            <button
              onClick={() => navigate("/memories")}
              className="px-3.5 py-2 rounded-xl border border-gray-200
                   bg-white text-sm font-medium text-gray-700
                   hover:bg-gray-50 hover:border-gray-300
                   transition"
            >
              🧠 <span className="hidden sm:inline">Memories</span>
            </button>

            {/* New Chat */}
            <button
              onClick={clearChat}
              className="px-3.5 py-2 rounded-xl border border-gray-200
                   bg-white text-sm font-medium text-gray-700
                   hover:bg-gray-50 hover:border-gray-300
                   transition"
            >
              ＋ <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Clear Memories */}
            <button
              onClick={clearMemories}
              className="px-3.5 py-2 rounded-xl border border-gray-200
                   bg-white text-sm font-medium text-gray-700
                   hover:bg-gray-50 hover:border-gray-300
                   transition"
            >
              🗑️ <span className="hidden sm:inline">Clear Memories</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-black text-white
                   text-sm font-medium
                   hover:bg-gray-800
                   transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            /* EMPTY / WELCOME SCREEN */
<div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4">

  {/* AI ICON */}
  <div className="relative mb-6">

    <div
      className="w-20 h-20 rounded-3xl
                 bg-gradient-to-br from-gray-900 to-black
                 text-white
                 flex items-center justify-center
                 text-3xl
                 shadow-xl"
    >
      🧠
    </div>

    {/* Online indicator */}
    <div
      className="absolute -right-1 -bottom-1
                 w-5 h-5 rounded-full
                 bg-green-500
                 border-4 border-white"
    />
  </div>

  {/* TITLE */}
  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
    How can I help you, {user?.name || "there"}?
  </h1>

  {/* DESCRIPTION */}
  <p className="text-gray-500 max-w-lg text-sm sm:text-base
                leading-relaxed mt-3">
    I'm your AI Digital Twin. I can remember your preferences,
    understand your goals, and provide personalized responses
    based on your conversations.
  </p>

  {/* FEATURES */}
  <div className="flex flex-wrap justify-center gap-2 mt-5">

    <span
      className="px-3 py-1.5 rounded-full
                 bg-gray-100 border border-gray-200
                 text-xs text-gray-600"
    >
      🧠 Long-term memory
    </span>

    <span
      className="px-3 py-1.5 rounded-full
                 bg-gray-100 border border-gray-200
                 text-xs text-gray-600"
    >
      🎯 Personalized responses
    </span>

    <span
      className="px-3 py-1.5 rounded-full
                 bg-gray-100 border border-gray-200
                 text-xs text-gray-600"
    >
      💬 Conversation context
    </span>

  </div>

  {/* SUGGESTION CARDS */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">

    {/* Memory prompt */}
    <button
      onClick={() => setInput("What do you remember about me?")}
      className="group text-left bg-white
                 border border-gray-200
                 rounded-2xl px-5 py-4
                 hover:border-gray-400
                 hover:shadow-md
                 hover:-translate-y-0.5
                 transition-all duration-200"
    >
      <div className="flex items-start gap-3">

        <div
          className="w-10 h-10 rounded-xl
                     bg-gray-100
                     flex items-center justify-center
                     text-lg shrink-0
                     group-hover:bg-gray-200
                     transition"
        >
          🧠
        </div>

        <div>
          <p className="font-semibold text-gray-800 text-sm">
            What do you remember about me?
          </p>

          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            View the information your Digital Twin has learned.
          </p>
        </div>

      </div>
    </button>

    {/* Career prompt */}
    <button
      onClick={() => setInput("Help me achieve my career goal")}
      className="group text-left bg-white
                 border border-gray-200
                 rounded-2xl px-5 py-4
                 hover:border-gray-400
                 hover:shadow-md
                 hover:-translate-y-0.5
                 transition-all duration-200"
    >
      <div className="flex items-start gap-3">

        <div
          className="w-10 h-10 rounded-xl
                     bg-gray-100
                     flex items-center justify-center
                     text-lg shrink-0
                     group-hover:bg-gray-200
                     transition"
        >
          🎯
        </div>

        <div>
          <p className="font-semibold text-gray-800 text-sm">
            Help me achieve my career goal
          </p>

          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Get guidance based on your goals and preferences.
          </p>
        </div>

      </div>
    </button>

    {/* Learning prompt */}
    <button
      onClick={() => setInput("Help me create a learning plan")}
      className="group text-left bg-white
                 border border-gray-200
                 rounded-2xl px-5 py-4
                 hover:border-gray-400
                 hover:shadow-md
                 hover:-translate-y-0.5
                 transition-all duration-200"
    >
      <div className="flex items-start gap-3">

        <div
          className="w-10 h-10 rounded-xl
                     bg-gray-100
                     flex items-center justify-center
                     text-lg shrink-0
                     group-hover:bg-gray-200
                     transition"
        >
          📚
        </div>

        <div>
          <p className="font-semibold text-gray-800 text-sm">
            Help me create a learning plan
          </p>

          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Build a personalized plan for your learning goals.
          </p>
        </div>

      </div>
    </button>

    {/* General prompt */}
    <button
      onClick={() => setInput("Tell me something interesting")}
      className="group text-left bg-white
                 border border-gray-200
                 rounded-2xl px-5 py-4
                 hover:border-gray-400
                 hover:shadow-md
                 hover:-translate-y-0.5
                 transition-all duration-200"
    >
      <div className="flex items-start gap-3">

        <div
          className="w-10 h-10 rounded-xl
                     bg-gray-100
                     flex items-center justify-center
                     text-lg shrink-0
                     group-hover:bg-gray-200
                     transition"
        >
          ✨
        </div>

        <div>
          <p className="font-semibold text-gray-800 text-sm">
            Tell me something interesting
          </p>

          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Start a casual conversation with your Digital Twin.
          </p>
        </div>

      </div>
    </button>

  </div>

  {/* SMALL HINT */}
  <p className="text-xs text-gray-400 mt-6">
    Choose a suggestion or type your own message below.
  </p>

</div>
          ) : (
            /* MESSAGES */
            <div>
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
                      className="w-9 h-9 rounded-full
                      bg-gradient-to-br from-gray-900 to-black
                      text-white
                      flex items-center justify-center
                      text-sm shrink-0
                      shadow-md"
                    >
                      🧠
                    </div>
                  )}

                  {/* MESSAGE BUBBLE */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%]
                        px-5 py-3.5
                        rounded-2xl
                        shadow-sm
                        break-words
                        leading-relaxed
                        text-sm sm:text-base
                        transition-all
                        duration-200
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

                        code: ({ children, className, ...props }) => (
                          <code
                            className={`px-1.5 py-0.5 rounded text-sm ${
                              msg.sender === "user"
                                ? "bg-gray-800 text-gray-100"
                                : "bg-gray-100 text-gray-800"
                            } ${className || ""}`}
                            {...props}
                          >
                            {children}
                          </code>
                        ),

                        pre: ({ children }) => (
                          <pre
                            className="bg-gray-900 text-gray-100
                             p-4 rounded-xl
                             overflow-x-auto
                             my-3 text-sm"
                          >
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* USER AVATAR */}
                  {msg.sender === "user" && (
                    <div
                      className="w-9 h-9 rounded-full
                     bg-gray-100
                     border border-gray-200
                     flex items-center justify-center
                     text-sm shrink-0
                     shadow-sm"
                    >
                      👤
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TYPING INDICATOR */}
          {loading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT AREA */}
      {/* INPUT AREA */}
<div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">

  <div className="w-full max-w-4xl mx-auto">

    {/* INPUT CONTAINER */}
    <div
      className="flex items-end gap-2
                 bg-gray-50
                 border border-gray-200
                 rounded-2xl
                 shadow-sm
                 px-2 py-2
                 focus-within:bg-white
                 focus-within:border-gray-400
                 focus-within:shadow-md
                 transition-all duration-200"
    >

      {/* TEXT INPUT */}
      <textarea
        rows={1}
        placeholder="Message your AI Digital Twin..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !loading) {
            e.preventDefault();
            sendMessage();
          }
        }}
        disabled={loading}
        className="flex-1
                   resize-none
                   bg-transparent
                   px-4 py-3
                   outline-none
                   text-sm sm:text-base
                   text-gray-900
                   placeholder-gray-400
                   disabled:cursor-not-allowed
                   max-h-32"
      />

      {/* SEND BUTTON */}
      <button
        onClick={sendMessage}
        disabled={loading || !input.trim()}
        aria-label="Send message"
        className={`w-11 h-11
                    rounded-xl
                    flex items-center justify-center
                    shrink-0
                    font-semibold
                    text-lg
                    transition-all duration-200
                    ${
                      loading || !input.trim()
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-sm"
                    }`}
      >
        {loading ? "..." : "↑"}
      </button>

    </div>

    {/* INPUT HINT */}
    <div className="flex items-center justify-between px-2 mt-2">

      <p className="text-xs text-gray-400">
        Your Digital Twin learns from your conversations.
      </p>

      <p className="text-xs text-gray-400 hidden sm:block">
        Enter ↵ &nbsp;•&nbsp; Shift + Enter ↵
      </p>

    </div>

  </div>

</div>

    </div>
  );
}
export default Chat;
