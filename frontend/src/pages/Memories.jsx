import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Memories() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:3000/memories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setMemories(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const deleteMemory = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this memory?",
    );
    const updateMemory = async (id) => {
      const values = editValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      if (values.length === 0) {
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`http://localhost:3000/memories/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            value: values,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.log("Update Memory Error:", data);
          return;
        }

        setMemories((prev) =>
          prev.map((memory) => (memory._id === id ? data.memory : memory)),
        );

        setEditingId(null);
        setEditValue("");
      } catch (error) {
        console.log("Update Memory Error:", error);
      }
    };

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`http://localhost:3000/memories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Delete Memory Error:", data);
        return;
      }

      setMemories((prev) => prev.filter((memory) => memory._id !== id));
    } catch (error) {
      console.log("Delete Memory Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              🧠 My Memories
            </h1>

            <p className="text-gray-500 mt-2">
              Things your AI Digital Twin remembers about you.
            </p>
          </div>

          <button
            onClick={() => navigate("/chat")}
            className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
          >
            ← Back to Chat
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-500">Loading memories...</p>
          </div>
        ) : memories.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-4">🧠</div>

            <h2 className="text-xl font-semibold text-gray-800">
              No memories yet
            </h2>

            <p className="text-gray-500 mt-2">
              Start chatting with your AI Digital Twin and it will remember
              important things about you.
            </p>

            <button
              onClick={() => navigate("/chat")}
              className="mt-6 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          /* Memory Cards */
          <div className="grid gap-4">
            {memories.map((memory) => (
              <div
                key={memory._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Memory Information */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🧠</span>

                      <h2 className="text-lg font-semibold text-gray-900 capitalize">
                        {memory.key.replaceAll("_", " ")}
                      </h2>
                    </div>

                    {editingId === memory._id ? (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                          placeholder="Enter memory values separated by commas"
                        />

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => updateMemory(memory._id)}
                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 mt-3 leading-relaxed">
                        {memory.value.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(memory._id);
                        setEditValue(memory.value.join(", "));
                      }}
                      className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"
                      title="Edit memory"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => deleteMemory(memory._id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      title="Delete memory"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Memories;
