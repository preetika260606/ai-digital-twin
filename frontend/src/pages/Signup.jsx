import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/signup",
        {
          name,
          email,
          password,
        }
      );

      console.log(response.data);

      alert("Signup successful! Please login.");

      navigate("/");
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);

      alert(
        error.response?.data?.message || "Signup failed"
      );
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">

        <h1 className="text-3xl font-bold mb-6 text-center">
          Signup
        </h1>

        <input
          type="text"
          placeholder="Name"
          className="w-full border p-3 rounded-lg mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          className="w-full bg-black text-white p-3 rounded-lg"
        >
          Signup
        </button>

        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="font-bold underline"
          >
            Login
          </button>
        </p>

      </div>
    </div>
  );
}

export default Signup;