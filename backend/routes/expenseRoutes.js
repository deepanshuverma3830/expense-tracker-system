const express = require("express");
const authMiddleware = require("../middleware/auth");

const {
  addExpense,
  getAllExpense,
  updateExpense,
  deleteExpense,
  getExpenseOverview,
  downloadExpenseExcel,
} = require("../controllers/expenseController");

const expenseRouter = express.Router();

expenseRouter.post("/add", authMiddleware, addExpense);
expenseRouter.get("/get", authMiddleware, getAllExpense);
expenseRouter.put("/update/:id", authMiddleware, updateExpense);
expenseRouter.get("/downloadexcel", authMiddleware, downloadExpenseExcel);
expenseRouter.delete("/delete/:id", authMiddleware, deleteExpense);
expenseRouter.get("/overview", authMiddleware, getExpenseOverview);

module.exports = expenseRouter;