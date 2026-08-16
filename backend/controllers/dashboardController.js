const incomeModel = require("../models/incomeModel");
const expenseModel = require("../models/expenseModel");

async function getDashboardOverview(req, res) {
  try {
    const userId = req.user._id;

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // Get monthly income
    const incomes = await incomeModel
      .find({
        userId,
        date: {
          $gte: startOfMonth,
          $lte: endOfToday,
        },
      })
      .lean();

    // Get monthly expenses
    const expenses = await expenseModel
      .find({
        userId,
        date: {
          $gte: startOfMonth,
          $lte: endOfToday,
        },
      })
      .lean();

    // Calculate income
    const monthlyIncome = incomes.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

    // Calculate expense
    const monthlyExpense = expenses.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

    // Savings
    const savings = monthlyIncome - monthlyExpense;

    // Savings rate
    const savingsRate =
      monthlyIncome === 0
        ? 0
        : Math.round((savings / monthlyIncome) * 100);

    // Recent transactions
    const recentTransactions = [
      ...incomes.map((item) => ({
        ...item,
        type: "income",
      })),

      ...expenses.map((item) => ({
        ...item,
        type: "expense",
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) -
          new Date(a.date || a.createdAt)
      )
      .slice(0, 10);

    // Expense category distribution
    const spendByCategory = {};

    expenses.forEach((expense) => {
      const category = expense.category || "Other";

      spendByCategory[category] =
        (spendByCategory[category] || 0) +
        Number(expense.amount || 0);
    });

    const expenseDistribution = Object.entries(
      spendByCategory
    ).map(([category, amount]) => ({
      category,
      amount,
      percent:
        monthlyExpense === 0
          ? 0
          : Math.round((amount / monthlyExpense) * 100),
    }));

    console.log("Dashboard Data:", {
      monthlyIncome,
      monthlyExpense,
      savings,
      incomes: incomes.length,
      expenses: expenses.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        monthlyIncome,
        monthlyExpense,
        savings,
        savingsRate,
        recentTransactions,
        spendByCategory,
        expenseDistribution,
      },
    });
  } catch (error) {
    console.error("getDashboardOverview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Dashboard fetch failed",
      error: error.message,
    });
  }
}

module.exports = getDashboardOverview;