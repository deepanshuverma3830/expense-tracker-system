const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");

const {
  addIncome,
  updateIncome,
  deleteIncome,
  downloadIncomeExcel,
  getIncomeOverview,
} = require("../controllers/incomeController");


// ADD INCOME
router.post(
  "/add",
  authMiddleware,
  addIncome
);


// UPDATE INCOME
router.put(
  "/update/:id",
  authMiddleware,
  updateIncome
);


// DELETE INCOME
router.delete(
  "/delete/:id",
  authMiddleware,
  deleteIncome
);


// DOWNLOAD EXCEL
router.get(
  "/downloadexcel",
  authMiddleware,
  downloadIncomeExcel
);


// OVERVIEW
router.get(
  "/overview",
  authMiddleware,
  getIncomeOverview
);


module.exports = router;