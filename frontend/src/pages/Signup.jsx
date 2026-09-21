import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/signup", {
        name,
        email,
        password,
      });

      console.log("Signup Response:", response.data);

      setSuccessMessage("Signup successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      console.log("Signup Error:", error);
      console.log("Backend Error:", error.response?.data);

      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-3xl shadow-lg mb-4">
            🧠
          </div>

          <h1 className="text-3xl font-bold text-white">AI Digital Twin</h1>

          <p className="text-gray-400 mt-2">
            Create your personalized AI assistant
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Create your account
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Get started with your personal Digital Twin.
            </p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage("");
              }}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              className="w-full border border-gray-300 px-4 py-3 rounded-xl outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSignup();
                }
              }}
            />
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-red-600 text-sm text-center">{errorMessage}</p>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-green-600 text-sm text-center">
                {successMessage}
              </p>
            </div>
          )}

          {/* Signup Button */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium transition hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {/* Login */}
          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-black font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Build your personalized AI experience.
        </p>
      </div>
    </div>
  );
}

export default Signup;
