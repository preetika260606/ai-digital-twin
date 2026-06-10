import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Chat() {
  const navigate = useNavigate();

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
      const response = await fetch("http://localhost:3000/history");

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setInput("");

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.reply,
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Welcome {user?.name} 👋</h1>

          <p className="text-sm text-gray-300">AI Digital Twin</p>
        </div>

        <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
          Logout
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-3 ${
              msg.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`px-4 py-2 rounded shadow inline-block ${
                msg.sender === "user" ? "bg-black text-white" : "bg-white"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>


      {/* INPUT AREA */}
      <div className="p-4 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          className="flex-1 border rounded p-3"
        />

        <button
          onClick={sendMessage}
          className="bg-black text-white px-6 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}


export default Chat;
