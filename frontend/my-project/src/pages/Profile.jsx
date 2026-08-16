import React, {
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import Modal from "react-modal";

import {
  Eye,
  EyeOff,
  User,
  Lock,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  toast,
  ToastContainer,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { profileStyles } from "../assets/dummyStyles";

const BASE_URL = "http://localhost:1234/api";

Modal.setAppElement("#root");

// ======================================================
// PASSWORD INPUT
// ======================================================

const PasswordInput = memo(
  ({
    name,
    label,
    value,
    error,
    showField,
    onToggle,
    onChange,
    disabled,
  }) => {
    return (
      <div>
        <label className={profileStyles.passwordLabel}>
          {label}
        </label>

        <div className={profileStyles.passwordContainer}>
          <input
            type={showField ? "text" : "password"}
            name={name}
            value={value}
            onChange={onChange}
            className={`${profileStyles.inputWithError} ${
              error
                ? "border-red-300"
                : "border-gray-200"
            }`}
            placeholder={`Enter ${label.toLowerCase()}`}
            disabled={disabled}
          />

          <button
            type="button"
            onClick={onToggle}
            className={profileStyles.passwordToggle}
            disabled={disabled}
          >
            {showField ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {error && (
          <p className={profileStyles.errorText}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

// ======================================================
// PROFILE
// ======================================================

const Profile = ({
  user: initialUser,
  onUpdateProfile,
  onLogout,
}) => {
  const navigate = useNavigate();

  // ====================================================
  // STATES
  // ====================================================

  const [user, setUser] = useState({
    name: "",
    email: "",
  });

  const [editMode, setEditMode] = useState(false);

  const [tempUser, setTempUser] = useState({
    name: "",
    email: "",
  });

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [passwordData, setPasswordData] =
    useState({
      current: "",
      new: "",
      confirm: "",
    });

  const [showPassword, setShowPassword] =
    useState({
      current: false,
      new: false,
      confirm: false,
    });

  const [passwordErrors, setPasswordErrors] =
    useState({});

  const [loading, setLoading] = useState(false);

  // ====================================================
  // GET AUTH TOKEN
  // ====================================================

  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      null
    );
  }, []);

  // ====================================================
  // COMMON API REQUEST
  // ====================================================

  const handleApiRequest = useCallback(
    async (method, endpoint, data = null) => {
      const token = getAuthToken();

      console.log(
        "PROFILE API TOKEN:",
        token ? "FOUND" : "NOT FOUND"
      );

      if (!token) {
        toast.error("Please login first");

        navigate("/login", {
          replace: true,
        });

        return null;
      }

      try {
        setLoading(true);

        const config = {
          method,
          url: `${BASE_URL}${endpoint}`,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        if (data !== null) {
          config.data = data;
        }

        console.log(
          "PROFILE API REQUEST:",
          method,
          `${BASE_URL}${endpoint}`
        );

        const response = await axios(config);

        console.log(
          "PROFILE API RESPONSE:",
          response.data
        );

        return response.data;
      } catch (error) {
        console.error(
          `PROFILE ${method} ${endpoint} ERROR:`,
          error?.response?.data || error
        );

        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");

          toast.error(
            "Session expired. Please login again."
          );

          if (typeof onLogout === "function") {
            onLogout();
          } else {
            navigate("/login", {
              replace: true,
            });
          }

          return null;
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken, navigate, onLogout]
  );

  // ====================================================
  // FETCH USER
  // ====================================================

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async () => {
      try {
        // Show existing user immediately
        if (initialUser && mounted) {
          const initialData = {
            name: initialUser.name || "",
            email: initialUser.email || "",
          };

          setUser(initialData);
          setTempUser(initialData);
        }

        // Fetch fresh user
        const data = await handleApiRequest(
          "GET",
          "/user/me"
        );

        if (!mounted || !data) {
          return;
        }

        const userData =
          data.user ||
          data.data ||
          data;

        if (!userData) {
          return;
        }

        const updatedUser = {
          name: userData.name || "",
          email: userData.email || "",
          ...(userData.id
            ? { id: userData.id }
            : {}),
          ...(userData._id
            ? { _id: userData._id }
            : {}),
        };

        setUser(updatedUser);

        setTempUser({
          name: updatedUser.name,
          email: updatedUser.email,
        });

        if (
          typeof onUpdateProfile ===
          "function"
        ) {
          onUpdateProfile(updatedUser);
        }

        const storedUser =
          JSON.stringify(updatedUser);

        if (localStorage.getItem("token")) {
          localStorage.setItem(
            "user",
            storedUser
          );
        }

        if (sessionStorage.getItem("token")) {
          sessionStorage.setItem(
            "user",
            storedUser
          );
        }
      } catch (error) {
        if (!mounted) return;

        console.error(
          "FETCH USER ERROR:",
          error?.response?.data || error
        );

        toast.error(
          error?.response?.data?.message ||
            "Failed to load user data"
        );
      }
    };

    fetchUserData();

    return () => {
      mounted = false;
    };
  }, [
    handleApiRequest,
    initialUser,
    onUpdateProfile,
  ]);

  // ====================================================
  // INPUT CHANGE
  // ====================================================

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setTempUser((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  // ====================================================
  // PASSWORD INPUT CHANGE
  // ====================================================

  const handlePasswordChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setPasswordData((prev) => ({
        ...prev,
        [name]: value,
      }));

      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    },
    []
  );

  // ====================================================
  // PASSWORD VISIBILITY
  // ====================================================

  const togglePasswordVisibility =
    useCallback((field) => {
      setShowPassword((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    }, []);

  // ====================================================
  // SAVE PROFILE
  // ====================================================

  const handleSaveProfile = async () => {
    const name = tempUser.name.trim();
    const email = tempUser.email
      .trim()
      .toLowerCase();

    if (!name || !email) {
      toast.error(
        "Name and email are required"
      );
      return;
    }

    try {
      const data = await handleApiRequest(
        "PUT",
        "/user/profile",
        {
          name,
          email,
        }
      );

      if (!data) return;

      const updatedData =
        data.user ||
        data.data ||
        data;

      const updatedUser = {
        name: updatedData.name || "",
        email: updatedData.email || "",
        ...(updatedData.id
          ? { id: updatedData.id }
          : {}),
        ...(updatedData._id
          ? { _id: updatedData._id }
          : {}),
      };

      setUser(updatedUser);

      setTempUser({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      setEditMode(false);

      if (
        typeof onUpdateProfile ===
        "function"
      ) {
        onUpdateProfile(updatedUser);
      }

      const storedUser =
        JSON.stringify(updatedUser);

      if (localStorage.getItem("token")) {
        localStorage.setItem(
          "user",
          storedUser
        );
      }

      if (sessionStorage.getItem("token")) {
        sessionStorage.setItem(
          "user",
          storedUser
        );
      }

      toast.success(
        "Profile updated successfully!"
      );
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update profile"
      );
    }
  };

  // ====================================================
  // CANCEL EDIT
  // ====================================================

  const handleCancelEdit = useCallback(() => {
    setTempUser({
      name: user.name || "",
      email: user.email || "",
    });

    setEditMode(false);
  }, [user]);

  // ====================================================
  // VALIDATE PASSWORD
  // ====================================================

  const validatePassword = useCallback(() => {
    const errors = {};

    if (!passwordData.current) {
      errors.current =
        "Current password is required";
    }

    if (!passwordData.new) {
      errors.new =
        "New password is required";
    } else if (
      passwordData.new.length < 8
    ) {
      errors.new =
        "Password must be at least 8 characters";
    }

    if (!passwordData.confirm) {
      errors.confirm =
        "Please confirm your password";
    } else if (
      passwordData.new !==
      passwordData.confirm
    ) {
      errors.confirm =
        "Passwords do not match";
    }

    setPasswordErrors(errors);

    return Object.keys(errors).length === 0;
  }, [passwordData]);

  // ====================================================
  // CLOSE PASSWORD MODAL
  // ====================================================

  const closePasswordModal = useCallback(() => {
    if (loading) return;

    setShowPasswordModal(false);

    setPasswordData({
      current: "",
      new: "",
      confirm: "",
    });

    setPasswordErrors({});

    setShowPassword({
      current: false,
      new: false,
      confirm: false,
    });
  }, [loading]);

  // ====================================================
  // CHANGE PASSWORD
  // ====================================================

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      const data = await handleApiRequest(
        "PUT",
        "/user/password",
        {
          currentPassword:
            passwordData.current,

          newPassword:
            passwordData.new,
        }
      );

      if (!data) return;

      toast.success(
        "Password changed successfully!"
      );

      closePasswordModal();
    } catch (error) {
      console.error(
        "PASSWORD UPDATE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to change password"
      );
    }
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setUser({
      name: "",
      email: "",
    });

    if (typeof onLogout === "function") {
      onLogout();
    } else {
      navigate("/login", {
        replace: true,
      });
    }
  }, [onLogout, navigate]);

  // ====================================================
  // RETURN
  // ====================================================

  return (
    <div className={profileStyles.container}>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className={profileStyles.mainContainer}>

        {/* HEADER */}

        <div className={profileStyles.header}>
          <div className={profileStyles.avatar}>
            <User className="w-12 h-12 text-white" />
          </div>

          <h1 className={profileStyles.userName}>
            {user.name || "Loading..."}
          </h1>

          <p className={profileStyles.content}>
            {user.email || "Loading..."}
          </p>
        </div>

        {/* CONTENT */}

        <div className={profileStyles.content}>
          <div className={profileStyles.grid}>

            {/* PERSONAL INFORMATION */}

            <div className={profileStyles.card}>

              <div className="flex justify-between items-center mb-6">

                <h2
                  className={
                    profileStyles.cardTitle
                  }
                >
                  <User
                    className={
                      profileStyles.icon
                    }
                  />

                  Personal Information
                </h2>

                {!editMode && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditMode(true)
                    }
                    className={
                      profileStyles.editButton
                    }
                    disabled={loading}
                  >
                    Edit
                  </button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">

                  {/* NAME */}

                  <div>
                    <label
                      className={
                        profileStyles.label
                      }
                    >
                      Full Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={tempUser.name}
                      onChange={
                        handleInputChange
                      }
                      className={
                        profileStyles.input
                      }
                      disabled={loading}
                    />
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label
                      className={
                        profileStyles.label
                      }
                    >
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={tempUser.email}
                      onChange={
                        handleInputChange
                      }
                      className={
                        profileStyles.input
                      }
                      disabled={loading}
                    />
                  </div>

                  {/* BUTTONS */}

                  <div className="flex gap-3 pt-4">

                    <button
                      type="button"
                      onClick={
                        handleSaveProfile
                      }
                      className={
                        profileStyles.buttonPrimary
                      }
                      disabled={loading}
                    >
                      {loading
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleCancelEdit
                      }
                      className={
                        profileStyles.buttonSecondary
                      }
                      disabled={loading}
                    >
                      Cancel
                    </button>

                  </div>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* NAME */}

                  <div>
                    <p
                      className={
                        profileStyles.label
                      }
                    >
                      Full Name
                    </p>

                    <p className="font-medium text-gray-800">
                      {user.name || "-"}
                    </p>
                  </div>

                  {/* EMAIL */}

                  <div>
                    <p
                      className={
                        profileStyles.label
                      }
                    >
                      Email Address
                    </p>

                    <p className="font-medium text-gray-800">
                      {user.email || "-"}
                    </p>
                  </div>

                  {/* SECURITY */}

                  <div
                    className={
                      profileStyles.card
                    }
                  >

                    <h2
                      className={
                        profileStyles.cardTitle
                      }
                    >
                      <Lock
                        className={
                          profileStyles.icon
                        }
                      />

                      Account Security
                    </h2>

                    <div className="space-y-4">

                      <div
                        className={
                          profileStyles.securityItem
                        }
                      >

                        <div>
                          <p
                            className={
                              profileStyles.securityText
                            }
                          >
                            Password
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordModal(
                              true
                            )
                          }
                          className={
                            profileStyles.changeButton
                          }
                          disabled={loading}
                        >
                          Change
                        </button>

                      </div>

                    </div>

                    {/* LOGOUT */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${profileStyles.buttonPrimary} mt-6 w-full hover:opacity-90 transition-opacity`}
                      disabled={loading}
                    >
                      Logout
                    </button>

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}

      <Modal
        isOpen={showPasswordModal}
        onRequestClose={closePasswordModal}
        contentLabel="Change Password"
        className="modal"
        overlayClassName="modal-overlay"
        shouldCloseOnOverlayClick={!loading}
        shouldCloseOnEsc={!loading}
      >

        <div
          className={
            profileStyles.modalContent
          }
        >

          <div
            className={
              profileStyles.modalHeader
            }
          >

            <h3
              className={
                profileStyles.modalTitle
              }
            >
              Change Password
            </h3>

            <button
              type="button"
              onClick={closePasswordModal}
              className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>

          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-4"
          >

            <PasswordInput
              name="current"
              label="Current Password"
              value={passwordData.current}
              error={passwordErrors.current}
              showField={showPassword.current}
              onToggle={() =>
                togglePasswordVisibility(
                  "current"
                )
              }
              onChange={
                handlePasswordChange
              }
              disabled={loading}
            />

            <PasswordInput
              name="new"
              label="New Password"
              value={passwordData.new}
              error={passwordErrors.new}
              showField={showPassword.new}
              onToggle={() =>
                togglePasswordVisibility(
                  "new"
                )
              }
              onChange={
                handlePasswordChange
              }
              disabled={loading}
            />

            <PasswordInput
              name="confirm"
              label="Confirm New Password"
              value={passwordData.confirm}
              error={passwordErrors.confirm}
              showField={
                showPassword.confirm
              }
              onToggle={() =>
                togglePasswordVisibility(
                  "confirm"
                )
              }
              onChange={
                handlePasswordChange
              }
              disabled={loading}
            />

            <div className="flex gap-3 pt-4">

              <button
                type="submit"
                className={
                  profileStyles.buttonPrimary
                }
                disabled={loading}
              >
                {loading
                  ? "Updating..."
                  : "Update Password"}
              </button>

              <button
                type="button"
                onClick={
                  closePasswordModal
                }
                className={
                  profileStyles.buttonSecondary
                }
                disabled={loading}
              >
                Cancel
              </button>

            </div>
            <div className={profileStyles.card}>
  <div className="flex justify-between items-center mb-6">
    <h2 className={profileStyles.cardTitle}>
      <User className={profileStyles.icon} />
      Personal Information
    </h2>

    {!editMode && (
      <button
        type="button"
        onClick={() => {
          console.log("EDIT CLICKED");

          setTempUser({
            name: user.name || "",
            email: user.email || "",
          });

          setEditMode(true);
        }}
        className={profileStyles.editButton}
        disabled={loading}
      >
        Edit
      </button>
    )}
  </div>

  {editMode ? (
    <div className="space-y-4">

      {/* NAME */}
      <div>
        <label className={profileStyles.label}>
          Full Name
        </label>

        <input
          type="text"
          name="name"
          value={tempUser.name}
          onChange={handleInputChange}
          className={profileStyles.input}
          disabled={loading}
        />
      </div>

      {/* EMAIL */}
      <div>
        <label className={profileStyles.label}>
          Email Address
        </label>

        <input
          type="email"
          name="email"
          value={tempUser.email}
          onChange={handleInputChange}
          className={profileStyles.input}
          disabled={loading}
        />
      </div>

      {/* BUTTONS */}
      <div className="flex gap-3 pt-4">

        <button
          type="button"
          onClick={handleSaveProfile}
          className={profileStyles.buttonPrimary}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={handleCancelEdit}
          className={profileStyles.buttonSecondary}
          disabled={loading}
        >
          Cancel
        </button>

      </div>
    </div>
  ) : (
    <div className="space-y-6">

      <div>
        <p className={profileStyles.label}>
          Full Name
        </p>

        <p className="font-medium text-gray-800">
          {user.name || "-"}
        </p>
      </div>

      <div>
        <p className={profileStyles.label}>
          Email Address
        </p>

        <p className="font-medium text-gray-800">
          {user.email || "-"}
        </p>
      </div>

      {/* SECURITY */}
      <div className={profileStyles.card}>

        <h2 className={profileStyles.cardTitle}>
          <Lock className={profileStyles.icon} />
          Account Security
        </h2>

        <div className="space-y-4">
          <div className={profileStyles.securityItem}>

            <div>
              <p className={profileStyles.securityText}>
                Password
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className={profileStyles.changeButton}
              disabled={loading}
            >
              Change
            </button>

          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={`${profileStyles.buttonPrimary} mt-6 w-full`}
          disabled={loading}
        >
          Logout
        </button>

      </div>
    </div>
  )}
</div>

          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;