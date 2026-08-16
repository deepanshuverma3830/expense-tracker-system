const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

module.exports = connectDB;