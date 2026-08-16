const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const JWT_SECRETKEY = process.env.JWT_SECRETKEY || "deepanshu";
const TOKEN_EXPIRES = "1d";

// ==================== CREATE TOKEN ====================

const createToken = (userId) => {
  return jwt.sign(
    { id: userId },
    JWT_SECRETKEY,
    { expiresIn: TOKEN_EXPIRES }
  );
};


// ==================== REGISTER USER ====================

async function registerUser(req, res) {
  const { name, email, password } = req.body;

  try {
    // Check fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already present",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Create token
    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// ==================== LOGIN USER ====================

async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create token
    const token = createToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// ==================== GET CURRENT USER ====================

async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("Current User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// ==================== UPDATE PROFILE ====================

async function updateProfile(req, res) {
  const { name, email } = req.body;

  try {
    // Validate fields
    if (!name || !email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid name and email are required",
      });
    }

    // Check email already used by another user
    const exists = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already present",
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        email,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// ==================== CHANGE PASSWORD ====================

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate password
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    // Find user
    const user = await User.findById(req.user.id)
      .select("password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const match = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("Update Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}


// ==================== EXPORT ====================

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  updatePassword,
};