const express = require("express");

const {
  loginUser,
  registerUser,
  getCurrentUser,
  updateProfile,
  updatePassword,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/auth");

const userRouter = express.Router();

// ================= AUTH =================

userRouter.post("/register", registerUser);

userRouter.post("/login", loginUser);

// ================= PROTECTED =================

userRouter.get(
  "/me",
  authMiddleware,
  getCurrentUser
);

userRouter.put(
  "/profile",
  authMiddleware,
  updateProfile
);

userRouter.put(
  "/password",
  authMiddleware,
  updatePassword
);

module.exports = userRouter;