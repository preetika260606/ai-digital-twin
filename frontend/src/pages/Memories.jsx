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

  // =========================
  // LOAD MEMORIES
  // =========================
  const loadMemories = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:3000/memories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      setMemories(data);
      setLoading(false);
    } catch (error) {
      console.log("Load Memories Error:", error);
      setLoading(false);
    }
  };

  // =========================
  // UPDATE MEMORY
  // =========================
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

      const response = await fetch(
        `http://localhost:3000/memories/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            value: values,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Update Memory Error:", data);
        return;
      }

      setMemories((prev) =>
        prev.map((memory) =>
          memory._id === id ? data.memory : memory,
        ),
      );

      setEditingId(null);
      setEditValue("");
    } catch (error) {
      console.log("Update Memory Error:", error);
    }
  };

  // =========================
  // DELETE MEMORY
  // =========================
  const deleteMemory = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this memory?",
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3000/memories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Delete Memory Error:", data);
        return;
      }

      setMemories((prev) =>
        prev.filter((memory) => memory._id !== id),
      );
    } catch (error) {
      console.log("Delete Memory Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">

        {/* =========================
            HEADER
        ========================= */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">

          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-2xl shadow-sm">
                🧠
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  My Memories
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  Your AI Digital Twin's long-term memory
                </p>
              </div>
            </div>

            <p className="text-gray-500 mt-4 max-w-xl leading-relaxed">
              These are the important things your AI Digital Twin has
              learned and remembers about you.
            </p>
          </div>

          <button
            onClick={() => navigate("/chat")}
            className="
              self-start sm:self-auto
              bg-black
              text-white
              px-5 py-3
              rounded-xl
              font-medium
              shadow-sm
              hover:bg-gray-800
              hover:shadow-md
              active:scale-95
              transition-all duration-200
            "
          >
            ← Back to Chat
          </button>
        </div>

        {/* =========================
            MEMORY COUNT
        ========================= */}
        {!loading && memories.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {memories.length}{" "}
              {memories.length === 1 ? "memory" : "memories"} saved
            </p>

            <div className="text-xs text-gray-400">
              You can edit or delete any memory
            </div>
          </div>
        )}

        {/* =========================
            LOADING
        ========================= */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">

            <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-black animate-spin" />

            <p className="text-gray-500 text-sm">
              Loading your memories...
            </p>
          </div>
        ) : memories.length === 0 ? (

          /* =========================
             EMPTY STATE
          ========================= */
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 sm:p-14 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-5">
              🧠
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              No memories yet
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
              Start chatting with your AI Digital Twin. As you share
              important information about yourself, it can remember
              useful details for future conversations.
            </p>

            <button
              onClick={() => navigate("/chat")}
              className="
                mt-6
                bg-black
                text-white
                px-6 py-3
                rounded-xl
                font-medium
                hover:bg-gray-800
                hover:shadow-md
                active:scale-95
                transition-all duration-200
              "
            >
              Start Chatting
            </button>
          </div>

        ) : (

          /* =========================
             MEMORY CARDS
          ========================= */
          <div className="grid gap-4">

            {memories.map((memory) => (
              <div
                key={memory._id}
                className="
                  bg-white
                  border border-gray-200
                  rounded-2xl
                  shadow-sm
                  p-5 sm:p-6
                  hover:shadow-md
                  hover:border-gray-300
                  transition-all duration-200
                "
              >
                <div className="flex justify-between items-start gap-4">

                  {/* MEMORY CONTENT */}
                  <div className="flex-1 min-w-0">

                    {/* MEMORY TITLE */}
                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        🧠
                      </div>

                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                          {memory.key.replaceAll("_", " ")}
                        </h2>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Saved memory
                        </p>
                      </div>
                    </div>

                    {/* EDIT MODE */}
                    {editingId === memory._id ? (
                      <div className="mt-5">

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update memory
                        </label>

                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) =>
                            setEditValue(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateMemory(memory._id);
                            }

                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditValue("");
                            }
                          }}
                          className="
                            w-full
                            border border-gray-300
                            rounded-xl
                            px-4 py-3
                            text-sm sm:text-base
                            text-gray-900
                            bg-white
                            outline-none
                            focus:border-gray-500
                            focus:ring-2
                            focus:ring-gray-200
                            transition
                          "
                          placeholder="Enter values separated by commas"
                          autoFocus
                        />

                        <p className="text-xs text-gray-400 mt-2">
                          Separate multiple values using commas.
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">

                          <button
                            onClick={() =>
                              updateMemory(memory._id)
                            }
                            disabled={!editValue.trim()}
                            className="
                              bg-black
                              text-white
                              px-4 py-2.5
                              rounded-xl
                              text-sm
                              font-medium
                              hover:bg-gray-800
                              disabled:bg-gray-200
                              disabled:text-gray-400
                              disabled:cursor-not-allowed
                              transition
                            "
                          >
                            Save Changes
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue("");
                            }}
                            className="
                              bg-gray-100
                              text-gray-700
                              px-4 py-2.5
                              rounded-xl
                              text-sm
                              font-medium
                              hover:bg-gray-200
                              transition
                            "
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (

                      /* NORMAL MEMORY VIEW */
                      <div className="mt-4">

                        <div className="flex flex-wrap gap-2">
                          {memory.value.map((value, index) => (
                            <span
                              key={index}
                              className="
                                inline-flex
                                items-center
                                bg-gray-100
                                text-gray-700
                                border border-gray-200
                                px-3 py-1.5
                                rounded-lg
                                text-sm
                              "
                            >
                              {value}
                            </span>
                          ))}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-1 shrink-0">

                    <button
                      onClick={() => {
                        setEditingId(memory._id);
                        setEditValue(memory.value.join(", "));
                      }}
                      className="
                        w-9 h-9
                        flex items-center justify-center
                        text-gray-400
                        hover:text-gray-900
                        hover:bg-gray-100
                        rounded-xl
                        transition
                      "
                      title="Edit memory"
                      aria-label="Edit memory"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() =>
                        deleteMemory(memory._id)
                      }
                      className="
                        w-9 h-9
                        flex items-center justify-center
                        text-gray-400
                        hover:text-red-500
                        hover:bg-red-50
                        rounded-xl
                        transition
                      "
                      title="Delete memory"
                      aria-label="Delete memory"
                    >
                      🗑️
                    </button>

                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

        {/* =========================
            FOOTER INFO
        ========================= */}
        {!loading && memories.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Your memories help your AI Digital Twin provide more
              personalized responses.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Memories;