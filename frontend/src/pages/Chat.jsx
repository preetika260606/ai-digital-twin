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

      if (!response.ok) {
        console.log("Chat API Error:", data);

        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.error || "Something went wrong.",
          },
        ]);

        return;
      }

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
          text: "Unable to connect to the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Logo + User */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center text-xl">
            🧠
          </div>

          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Digital Twin</h1>

            <p className="text-sm text-gray-500">Welcome {user?.name} 👋</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => navigate("/memories")}
            className="px-4 py-2 rounded-lg border border-gray-200
                 hover:bg-gray-100 transition"
          >
            🧠 Memories
          </button>

          <button
            onClick={clearChat}
            className="px-4 py-2 rounded-lg border border-gray-200
                 hover:bg-gray-100 transition"
          >
            ＋ New Chat
          </button>

          <button
            onClick={clearMemories}
            className="px-4 py-2 rounded-lg border border-gray-200
                 hover:bg-gray-100 transition"
          >
            Clear Memories
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-black text-white
                 hover:bg-gray-800 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-lg">
              <div
                className="w-16 h-16 bg-black text-white rounded-2xl
                      flex items-center justify-center
                      text-3xl mx-auto mb-5"
              >
                🧠
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                AI Digital Twin
              </h2>

              <p className="text-gray-500 mb-8">
                Your personalized AI companion that remembers your conversations
                and preferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-800">💬 Chat</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Start a conversation
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-800">🧠 Memory</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ask about your memories
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-800">
                    ✨ Personal
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Get personalized responses
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 mb-5 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* AI Avatar */}
            {msg.sender === "ai" && (
              <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm shrink-0">
                🧠
              </div>
            )}

            {/* Message */}
            <div
              className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-sm break-words whitespace-pre-wrap leading-relaxed ${
                msg.sender === "user"
                  ? "bg-black text-white rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }) {
                      return inline ? (
                        <code
                          className="bg-gray-100 px-1.5 py-0.5 rounded text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto my-3">
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
            </div>

            {/* User Avatar */}
            {msg.sender === "user" && (
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0">
                👤
              </div>
            )}
          </div>
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
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
              className="w-full border border-gray-200 rounded-2xl
                   px-5 py-4 pr-4 outline-none
                   bg-gray-50
                   focus:bg-white
                   focus:border-gray-400
                   focus:ring-2 focus:ring-gray-100
                   transition"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className={`h-12 px-6 rounded-2xl font-medium
                  text-white transition
                  ${
                    loading || !input.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-black hover:bg-gray-800"
                  }`}
          >
            {loading ? "Thinking..." : "Send ↑"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-2">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}

export default Chat; //this is thee code
