const expenseModel = require("../models/expenseModel");
const getDateRange = require("../utils/dataFilter");
const XLSX = require("xlsx");

// ======================================================
// ADD EXPENSE
// ======================================================
async function addExpense(req, res) {
  try {
    const userId = req.user._id;

    const {
      description,
      amount,
      category,
      date,
    } = req.body;

    if (
      !description ||
      amount === undefined ||
      !category ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newExpense = await expenseModel.create({
      userId,
      description: description.trim(),
      amount: Number(amount),
      category,
      date: new Date(date),
    });

    return res.status(201).json({
      success: true,
      message: "Expense added successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error("ADD EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ======================================================
// GET ALL EXPENSES
// ======================================================
async function getAllExpense(req, res) {
  try {
    const userId = req.user._id;

    const expenses = await expenseModel
      .find({ userId })
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      expense: expenses,
    });
  } catch (error) {
    console.error("GET ALL EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ======================================================
// UPDATE EXPENSE
// ======================================================
async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const { description, amount, category, date } = req.body;
    const userId = req.user._id;

    const updatedExpense =
      await expenseModel.findOneAndUpdate(
        {
          _id: id,
          userId,
        },
        {
          description: description?.trim(),
          amount:
            amount !== undefined
              ? Number(amount)
              : undefined,
          category,
          date: date ? new Date(date) : undefined,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ======================================================
// DELETE EXPENSE
// ======================================================
async function deleteExpense(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const expense =
      await expenseModel.findOneAndDelete({
        _id: id,
        userId,
      });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EXPENSE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ======================================================
// DOWNLOAD EXPENSE EXCEL
// ======================================================
async function downloadExpenseExcel(req, res) {
  try {
    const userId = req.user._id;

    const expenses = await expenseModel
      .find({ userId })
      .sort({ date: -1 })
      .lean();

    const plainData = expenses.map((exp) => ({
      Description: exp.description,
      Amount: exp.amount,
      Category: exp.category,
      Date: new Date(exp.date).toLocaleDateString(),
    }));

    const worksheet =
      XLSX.utils.json_to_sheet(plainData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Expenses"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="expense_details.xlsx"'
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    console.error(
      "DOWNLOAD EXPENSE EXCEL ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ======================================================
// EXPENSE OVERVIEW
// ======================================================
async function getExpenseOverview(req, res) {
  try {
    const userId = req.user._id;

    const { range = "monthly" } = req.query;

    const { start, end } =
      getDateRange(range);

    const expenses = await expenseModel
      .find({
        userId,
        date: {
          $gte: start,
          $lte: end,
        },
      })
      .sort({ date: -1 })
      .lean();

    const totalExpense = expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );

    const averageExpense =
      expenses.length > 0
        ? Math.round(
            totalExpense / expenses.length
          )
        : 0;

    const numberOfTransactions =
      expenses.length;

    const recentTransactions =
      expenses.slice(0, 9);

    return res.status(200).json({
      success: true,
      data: {
        totalExpense,
        averageExpense,
        numberOfTransactions,
        recentTransactions,
        range,
      },
    });
  } catch (error) {
    console.error(
      "GET EXPENSE OVERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ======================================================
// EXPORT
// ======================================================
module.exports = {
  addExpense,
  getAllExpense,
  updateExpense,
  deleteExpense,
  downloadExpenseExcel,
  getExpenseOverview,
};