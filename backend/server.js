const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");
const userRouter = require("./routes/userRoutes");
const incomeRouter = require("./routes/incomeRoutes");
const expenseRouter = require("./routes/expenseRoutes");
const dashboardRouter = require("./routes/dashboardRoutes");

const port = process.env.PORT || 1234;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/", (req, res) => {
  res.send("Server is running");
});

const startServer = async () => {
  try {
    console.log("1. Starting server...");

    await connectDB();

    console.log("2. Database connected...");

    app.listen(port, () => {
      console.log(`3. Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Server could not start:", error);
  }
};

startServer();