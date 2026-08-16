const incomeModel = require("../models/incomeModel");
const XLSX = require("xlsx");
const getDateRange = require("../utils/dataFilter");

// ==================== ADD INCOME ====================
async function addIncome(req, res) {
  console.log("🔥🔥🔥 ADD INCOME CONTROLLER HIT 🔥🔥🔥");

  try {
    console.log("REQ.USER:", req.user);
    console.log("REQ.BODY:", req.body);

    // baaki code...

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const { description, amount, category, date } = req.body;

    if (!description || amount === undefined || !category || !date) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    const incomeDate = new Date(date);

    if (Number.isNaN(incomeDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const newIncome = new incomeModel({
      userId,
      description: description.trim(),
      amount: numericAmount,
      category: category.trim(),
      date: incomeDate,
      type: "income",
    });

    const savedIncome = await newIncome.save();

    console.log("✅ INCOME SAVED:", savedIncome);

    return res.status(201).json({
      success: true,
      message: "Income added successfully",
      income: savedIncome,
    });
  } catch (error) {
    console.error("========== ADD INCOME ERROR ==========");
  console.error("ERROR OBJECT:", error);
  console.error("ERROR NAME:", error.name);
  console.error("ERROR MESSAGE:", error.message);
  console.error("ERROR STACK:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ==================== GET ALL INCOME ====================
async function getAllIncome(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const income = await incomeModel
      .find({ userId })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      income,
    });
  } catch (error) {
    console.error("GET INCOME ERROR:", error);
   

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ==================== UPDATE INCOME ====================
async function updateIncome(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    const {
      description,
      amount,
      category,
      date,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    if (!description || amount === undefined || !category || !date) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    const incomeDate = new Date(date);

    if (Number.isNaN(incomeDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    const updatedIncome = await incomeModel.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        description: description.trim(),
        amount: numericAmount,
        category: category.trim(),
        date: incomeDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedIncome) {
      return res.status(404).json({
        success: false,
        message: "Income not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Income updated successfully",
      income: updatedIncome,
    });
  } catch (error) {
    console.error("UPDATE INCOME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ==================== DELETE INCOME ====================
async function deleteIncome(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const income = await incomeModel.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Income not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Income deleted successfully",
    });
  } catch (error) {
    console.error("DELETE INCOME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ==================== DOWNLOAD EXCEL ====================
async function downloadIncomeExcel(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const income = await incomeModel
      .find({ userId })
      .sort({ date: -1 });

    const plainData = income.map((inc) => ({
      Date: inc.date
        ? new Date(inc.date).toLocaleDateString()
        : "",
      Description: inc.description,
      Amount: inc.amount,
      Category: inc.category,
      Type: "Income",
    }));

    const worksheet = XLSX.utils.json_to_sheet(plainData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Income"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="income_details.xlsx"'
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    console.error("DOWNLOAD EXCEL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ==================== GET INCOME OVERVIEW ====================
async function getIncomeOverview(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;

    const { range = "monthly" } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    const { start, end } = getDateRange(range);

    const incomes = await incomeModel
      .find({
        userId,
        date: {
          $gte: start,
          $lte: end,
        },
      })
      .sort({ date: -1 });

    const totalIncome = incomes.reduce(
      (total, income) =>
        total + Number(income.amount || 0),
      0
    );

    const averageIncome =
      incomes.length > 0
        ? totalIncome / incomes.length
        : 0;

    const numberOfTransactions = incomes.length;

    const recentTransactions = incomes.slice(0, 9);

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        averageIncome,
        numberOfTransactions,
        recentTransactions,
        range,
      },
    });
  } catch (error) {
    console.error("INCOME OVERVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
}

// ==================== EXPORT ====================
module.exports = {
  addIncome,
  getAllIncome,
  updateIncome,
  deleteIncome,
  downloadIncomeExcel,
  getIncomeOverview,
};