
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { signupStyles } from "../assets/dummyStyles";

// ======================================================
// API
// ======================================================

const API_URL =
  "https://expense-tracker-system-2-fgq5.onrender.com/api";

// ======================================================
// SIGNUP COMPONENT
// ======================================================

const Signup = ({ onSignup }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // ======================================================
  // GET PROFILE
  // ======================================================

  const fetchProfile = async (token) => {
    if (!token) return null;

    const response = await axios.get(
      `${API_URL}/user/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data?.user || null;
  };

  // ======================================================
  // SAVE AUTH
  // ======================================================

  const persistAuth = (profile, token) => {
    const storage = rememberMe
      ? localStorage
      : sessionStorage;

    try {
      if (token) {
        storage.setItem("token", token);
      }

      if (profile) {
        storage.setItem(
          "user",
          JSON.stringify(profile)
        );
      }
    } catch (error) {
      console.error("Storage Error:", error);
    }
  };

  // ======================================================
  // VALIDATION
  // ======================================================

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ======================================================
  // SUBMIT
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(
      "========== SIGNUP BUTTON CLICKED =========="
    );

    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log(
        "REGISTER URL:",
        `${API_URL}/user/register`
      );

      const response = await axios.post(
        `${API_URL}/user/register`,
        {
          name: name.trim(),
          email: email.trim(),
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "SIGNUP RESPONSE:",
        response.data
      );

      const data = response.data || {};

      const token = data.token || null;

      let profile = data.user || null;

      // ==================================================
      // IF USER NOT RETURNED BUT TOKEN IS AVAILABLE
      // ==================================================

      if (!profile && token) {
        try {
          profile = await fetchProfile(token);
        } catch (profileError) {
          console.warn(
            "Could not fetch profile:",
            profileError
          );
        }
      }

      // ==================================================
      // FALLBACK PROFILE
      // ==================================================

      if (!profile) {
        profile = {
          name: name.trim(),
          email: email.trim(),
        };
      }

      // ==================================================
      // SAVE AUTH
      // ==================================================

      if (token) {
        persistAuth(profile, token);
      }

      console.log(
        "SIGNUP AUTH SAVED:",
        Boolean(token)
      );

      // ==================================================
      // CALL APP CALLBACK
      // ==================================================

      if (typeof onSignup === "function") {
        onSignup(
          profile,
          rememberMe,
          token
        );
      }

      // ==================================================
      // REDIRECT
      // ==================================================

      navigate("/dashboard", {
        replace: true,
      });

      setPassword("");
    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error?.response?.data || error
      );

      const message =
        error?.response?.data?.message ||
        "Unable to create account";

      setErrors({
        api: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className={signupStyles.pageContainer}>
      <div className={signupStyles.cardContainer}>

        {/* HEADER */}

        <div className={signupStyles.header}>

          <button
            type="button"
            className={signupStyles.backButton}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className={signupStyles.avatar}>
            <User className="w-10 h-10 text-white" />
          </div>

          <h1 className={signupStyles.headertitle}>
            Create Account
          </h1>

          <p className={signupStyles.formContainer}>
            Join ExpenseFlow to manage your finances
          </p>

        </div>

        {/* FORM */}

        <div className={signupStyles.formContainer}>

          {errors.api && (
            <p className={signupStyles.apiError}>
              {errors.api}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            {/* NAME */}

            <div className="mb-6">

              <label htmlFor="name">
                Full Name
              </label>

              <div
                className={
                  signupStyles.inputContainer
                }
              >

                <div
                  className={
                    signupStyles.inputIcon
                  }
                >
                  <User className="w-5 h-5" />
                </div>

                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className={`${signupStyles.input} ${
                    errors.name
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="John Doe"
                />

              </div>

              {errors.name && (
                <p
                  className={
                    signupStyles.fieldError
                  }
                >
                  {errors.name}
                </p>
              )}

            </div>

            {/* EMAIL */}

            <div className="mb-6">

              <label htmlFor="email">
                Email
              </label>

              <div
                className={
                  signupStyles.inputContainer
                }
              >

                <div
                  className={
                    signupStyles.inputIcon
                  }
                >
                  <Mail className="w-5 h-5" />
                </div>

                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className={`${signupStyles.input} ${
                    errors.email
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="your@mail.com"
                />

              </div>

              {errors.email && (
                <p
                  className={
                    signupStyles.fieldError
                  }
                >
                  {errors.email}
                </p>
              )}

            </div>

            {/* PASSWORD */}

            <div className="mb-6">

              <label htmlFor="password">
                Password
              </label>

              <div
                className={
                  signupStyles.inputContainer
                }
              >

                <div
                  className={
                    signupStyles.inputIcon
                  }
                >
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className={`${signupStyles.input} ${
                    errors.password
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  className={
                    signupStyles.passwordToggle
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>

              </div>

              {errors.password && (
                <p
                  className={
                    signupStyles.fieldError
                  }
                >
                  {errors.password}
                </p>
              )}

            </div>

            {/* REMEMBER ME */}

            <div
              className={
                signupStyles.checkboxContainer
              }
            >

              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(
                    e.target.checked
                  )
                }
                className={
                  signupStyles.checkbox
                }
              />

              <label
                htmlFor="remember"
                className={
                  signupStyles.checkboxLabel
                }
              >
                Remember me
              </label>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isLoading}
              className={`${signupStyles.button} ${
                isLoading
                  ? signupStyles.buttonDisabled
                  : ""
              }`}
            >

              {isLoading ? (
                <>
                  <svg
                    className={
                      signupStyles.spinner
                    }
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  Creating account...
                </>
              ) : (
                "Create Account"
              )}

            </button>

          </form>

          {/* LOGIN LINK */}

          <div
            className={
              signupStyles.signInContainer
            }
          >
            <p
              className={
                signupStyles.signInText
              }
            >
              Already have an account?{" "}

              <Link
                to="/login"
                className={
                  signupStyles.signInLink
                }
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;

