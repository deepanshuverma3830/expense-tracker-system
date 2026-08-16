import React, { useState } from "react";
import axios from "axios";
import {
  Mail,
  User,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("========== LOGIN BUTTON CLICKED ==========");

    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);

      // ==============================
      // LOGIN API
      // ==============================

      const response = await axios.post(
        "http://localhost:1234/api/user/login",
        {
          email: email.trim(),
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      // ==============================
      // GET TOKEN + USER
      // ==============================

      const token = response.data?.token;
      const user = response.data?.user;

      console.log("TOKEN RECEIVED:", token);
      console.log("USER RECEIVED:", user);

      if (!token) {
        setError("Login failed: token not received");
        return;
      }

      if (!user) {
        setError("Login failed: user data not received");
        return;
      }

      // ==============================
      // CLEAR OLD AUTH
      // ==============================

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // ==============================
      // SAVE AUTH
      // ==============================

      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        console.log("AUTH SAVED: localStorage");
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        console.log("AUTH SAVED: sessionStorage");
      }

      // ==============================
      // VERIFY STORAGE
      // ==============================

      console.log(
        "STORED TOKEN:",
        localStorage.getItem("token") ||
          sessionStorage.getItem("token")
          ? "FOUND"
          : "NOT FOUND"
      );

      console.log(
        "STORED USER:",
        localStorage.getItem("user") ||
          sessionStorage.getItem("user")
      );

      // ==============================
      // IMPORTANT
      // App.jsx expects:
      // user, rememberMe, token
      // ==============================

      if (typeof onLogin === "function") {
        onLogin(
          user,
          rememberMe,
          token
        );
      } else {
        console.error(
          "onLogin function is missing"
        );
        setError("Login configuration error");
        return;
      }

      // ==============================
      // CLEAR PASSWORD
      // ==============================

      setPassword("");

      // ==============================
      // GO DASHBOARD
      // ==============================

      navigate("/dashboard", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error?.response?.data || error
      );

      setError(
        error?.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center px-4 py-8">

      <div className="relative w-full max-w-md">

        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-8">

          {/* HEADER */}

          <div className="text-center mb-8">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500">

              <User className="h-8 w-8 text-white" />

            </div>

            <h1 className="text-3xl font-bold text-white">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to your ExpenseFlow account
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Email Address
              </label>

              <div className="relative">

                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="your@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>

              <div className="relative">

                <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3.5 pl-12 pr-12 text-white placeholder-slate-500 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

            {/* REMEMBER ME */}

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(
                    e.target.checked
                  )
                }
                className="h-4 w-4 accent-teal-500"
              />

              Remember me

            </label>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-3.5 font-semibold text-white shadow-lg transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {isLoading ? (
                <span className="flex items-center justify-center gap-2">

                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Logging in...

                </span>
              ) : (
                "SUBMIT"
              )}

            </button>

          </form>

          {/* SIGNUP */}

          <div className="mt-6 text-center">

            <p className="text-sm text-slate-400">

              Don't have an account?{" "}

              <Link
                to="/signup"
                className="font-medium text-teal-400 hover:text-teal-300"
              >
                Create one
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;