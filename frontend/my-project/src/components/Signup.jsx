import React, { useState } from "react";
import axios from "axios";
import { useNavigate,Link} from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { signupStyles } from "../assets/dummyStyles";

const Signup = ({
  API_URL= "https://expense-tracker-system-2-fgq5.onrender.com/api",
  onSignup,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const fetchProfile = async (token) => {
    if (!token) return null;

    const res = await axios.get(
      `${API_URL}/api/user/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  };

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

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});

    if (!validateForm()) return;

    setIsLoading(false);

    try {
      const response = await axios.post(
        `${API_URL}/api/user/register`,
        {
          name,
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data || {};

      const token = data.token ?? null;

      let profile = data.user ?? null;

      if (!profile) {
        const copy = { ...data };

        delete copy.token;
        delete copy.user;

        if (Object.keys(copy).length) {
          profile = copy;
        }
      }

      if (!profile && token) {
        try {
          profile = await fetchProfile(token);
        } catch (fetchErr) {
          console.warn(
            "Could not fetch profile after signup token:",
            fetchErr
          );

          profile = null;
        }
      }

      if (!profile) {
        profile = {
          name,
          email,
        };
      }

      persistAuth(profile, token);

      if (typeof onSignup === "function") {
        try {
          onSignup(
            profile,
            rememberMe,
            token
          );
        } catch (callErr) {
          console.warn(
            "onSignup threw:",
            callErr
          );

          navigate("/");
        }
      } else {
        navigate("/");
      }

      setPassword("");
    } catch (err) {
      console.error(
        "Signup error:",
        err?.response || err
      );

      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setErrors({
          api: err.response.data.message,
        });
      } else {
        setErrors({
          api:
            err.message ||
            "An unexpected error occurred",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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

              <div className={signupStyles.inputContainer}>

                <div className={signupStyles.inputIcon}>
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
                <p className={signupStyles.fieldError}>
                  {errors.name}
                </p>
              )}

            </div>

            {/* EMAIL */}
            <div className="mb-6">

              <label htmlFor="email">
                Email
              </label>

              <div className={signupStyles.inputContainer}>

                <div className={signupStyles.inputIcon}>
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
                  placeholder="yours@mail.com"
                />

              </div>

              {errors.email && (
                <p className={signupStyles.fieldError}>
                  {errors.email}
                </p>
              )}

            </div>

            {/* PASSWORD */}
            <div className="mb-6">

              <label htmlFor="password">
                Password
              </label>

              <div className={signupStyles.inputContainer}>

                <div className={signupStyles.inputIcon}>
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
                    setShowPassword(!showPassword)
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
                <p className={signupStyles.fieldError}>
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
                  setRememberMe(e.target.checked)
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
              className={`${signupStyles.button} ${
                isLoading
                  ? signupStyles.buttonDisabled
                  : ""
              }`}
              disabled={isLoading}
            >

              {isLoading ? (
                <>
                  <svg
                    className={signupStyles.spinner}
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
          <div className={signupStyles.signInContainer}>
            <p className={signupStyles.signInText}>
              Already have't an account?{" "}
              <Link to="/login" className={signupStyles.signInLink}>
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