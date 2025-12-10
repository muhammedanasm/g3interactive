import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  // Acceptance Criteria: Validate format and empty fields
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email) && password.length > 0) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Using Postman payload structure
      const response = await api.post("/api/login", {
        email,
        password,
        ip_address: "13.210.33.250",
      });

      const { access_token, companies } = response.data;

      // Store token and company details
      localStorage.setItem("token", access_token);
      // Handling company_id based on Postman logic (single vs multiple)
      const companyId =
        companies?.id || (Array.isArray(companies) ? companies[0]?.id : 4);
      localStorage.setItem("company_id", companyId);

      navigate("/users");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign In to your Account
        </h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Welcome back! please enter your detail
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={`w-full py-2 px-4 rounded text-white font-medium ${
              isValid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
