import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";

import { useOutletContext } from "react-router-dom";

import {
  Plus,
  DollarSign,
  Download,
  Eye,
  Calendar,
  TrendingDown,
  BarChart2,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import axios from "axios";

import { exportToExcel } from "../utils/exportUtils";
import FinancialCard from "../components/FinancialCard";
import TimeFrameSelector from "../components/TimeFrame";
import TransactionItem from "../components/TransictionItem";
import AddTransactionModal from "../components/Add";

import {
  getTimeFrameRange,
  generateChartPoints,
} from "../components/Helpers";

import { CATEGORY_ICONS } from "../assets/color";
import { expensePageStyles as styles } from "../assets/dummyStyles";

// ======================================================
// API BASE
// ======================================================

const API_BASE = "http://localhost:1234/api";

// ======================================================
// DATE HELPER
// ======================================================

function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (
    typeof dateValue === "string" &&
    dateValue.length === 10
  ) {
    const now = new Date();

    const hhmmss = now
      .toTimeString()
      .slice(0, 8);

    const combined = new Date(
      `${dateValue}T${hhmmss}`
    );

    return combined.toISOString();
  }

  const date = new Date(dateValue);

  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  return new Date().toISOString();
}

// ======================================================
// EXPENSE PAGE
// ======================================================

const ExpensePage = () => {
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
  } = useOutletContext();

  // ====================================================
  // STATES
  // ====================================================

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [showAll, setShowAll] = useState(false);

  const [filter, setFilter] = useState("all");

  const [selectedMonth, setSelectedMonth] = useState(null);

  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "Food",
    date: new Date()
      .toISOString()
      .split("T")[0],
  });

  const [newTransaction, setNewTransaction] = useState({
    date: new Date()
      .toISOString()
      .split("T")[0],

    description: "",

    amount: "",

    type: "expense",

    category: "Food",
  });

  const [overview, setOverview] = useState({
    totalExpense: 0,
    averageExpense: 0,
    numberOfTransactions: 0,
    recentTransactions: [],
    range: "monthly",
  });

  // ====================================================
  // AUTH
  // ====================================================

  const getAuthHeaders = useCallback(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    console.log(
      "EXPENSE TOKEN:",
      token ? "FOUND" : "NOT FOUND"
    );

    if (!token) {
      console.warn(
        "No authentication token found"
      );

      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);

  // ====================================================
  // FETCH EXPENSE OVERVIEW
  // ====================================================

  const fetchOverview = useCallback(
    async (range = timeFrame || "monthly") => {
      try {
        const url =
          `${API_BASE}/expense/overview`;

        console.log(
          "FETCH EXPENSE OVERVIEW:",
          url
        );

        const response = await axios.get(
          url,
          {
            headers: getAuthHeaders(),
            params: {
              range,
            },
          }
        );

        console.log(
          "EXPENSE OVERVIEW RESPONSE:",
          response.data
        );

        if (response.data?.success) {
          const payload =
            response.data.data || {};

          setOverview({
            totalExpense:
              Number(
                payload.totalExpense
              ) || 0,

            averageExpense:
              Number(
                payload.averageExpense
              ) || 0,

            numberOfTransactions:
              Number(
                payload.numberOfTransactions
              ) || 0,

            recentTransactions:
              payload.recentTransactions ||
              [],

            range:
              payload.range ||
              range,
          });
        }
      } catch (error) {
        console.error(
          "FETCH EXPENSE OVERVIEW ERROR:",
          error?.response?.data ||
            error.message
        );
      }
    },
    [timeFrame, getAuthHeaders]
  );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchOverview(
      timeFrame || "monthly"
    );
  }, [
    fetchOverview,
    timeFrame,
  ]);

  // ====================================================
  // TIME FRAME RANGE
  // ====================================================

  const timeFrameRange = useMemo(
    () =>
      getTimeFrameRange(
        timeFrame,
        selectedMonth
      ),
    [
      timeFrame,
      selectedMonth,
    ]
  );

  // ====================================================
  // CHART POINTS
  // ====================================================

  const chartPoints = useMemo(
    () =>
      generateChartPoints(
        timeFrame,
        timeFrameRange
      ),
    [
      timeFrame,
      timeFrameRange,
    ]
  );

  // ====================================================
  // DATE RANGE CHECK
  // ====================================================

  const isDateInRange = useCallback(
    (date, start, end) => {
      const transactionDate =
        new Date(date);

      const startDate =
        new Date(start);

      const endDate =
        new Date(end);

      if (
        isNaN(
          transactionDate.getTime()
        ) ||
        isNaN(startDate.getTime()) ||
        isNaN(endDate.getTime())
      ) {
        return false;
      }

      transactionDate.setHours(
        0,
        0,
        0,
        0
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      return (
        transactionDate >=
          startDate &&
        transactionDate <= endDate
      );
    },
    []
  );

  // ====================================================
  // EXPENSE TRANSACTIONS
  // ====================================================

  const expenseTransactions = useMemo(() => {
    return [...(outletTransactions || [])]
      .filter(
        (transaction) =>
          transaction.type ===
          "expense"
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
  }, [outletTransactions]);

  // ====================================================
  // TIME FRAME TRANSACTIONS
  // ====================================================

  const timeFrameTransactions =
    useMemo(() => {
      return expenseTransactions.filter(
        (transaction) =>
          isDateInRange(
            transaction.date,
            timeFrameRange.start,
            timeFrameRange.end
          )
      );
    }, [
      expenseTransactions,
      timeFrameRange,
      isDateInRange,
    ]);

  // ====================================================
  // FILTER
  // ====================================================

  const filteredTransactions =
    useMemo(() => {
      if (filter === "all") {
        return timeFrameTransactions;
      }

      const now = new Date();

      const selectedDate =
        selectedMonth
          ? new Date(selectedMonth)
          : null;

      const compareYear =
        selectedDate
          ? selectedDate.getFullYear()
          : now.getFullYear();

      const compareMonth =
        selectedDate
          ? selectedDate.getMonth()
          : now.getMonth();

      return timeFrameTransactions.filter(
        (transaction) => {
          const transDate =
            new Date(
              transaction.date
            );

          if (
            filter === "month"
          ) {
            return (
              transDate.getFullYear() ===
                compareYear &&
              transDate.getMonth() ===
                compareMonth
            );
          }

          if (
            filter === "year"
          ) {
            return (
              transDate.getFullYear() ===
              compareYear
            );
          }

          return (
            transaction.category
              ?.toLowerCase() ===
            filter.toLowerCase()
          );
        }
      );
    }, [
      timeFrameTransactions,
      filter,
      selectedMonth,
    ]);

  // ====================================================
  // TOTAL EXPENSE
  // ====================================================

  const totalExpense = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.amount || 0
        ),
      0
    );
  }, [filteredTransactions]);

  // ====================================================
  // AVERAGE
  // ====================================================

  const averageExpense = useMemo(() => {
    if (
      filteredTransactions.length ===
      0
    ) {
      return 0;
    }

    return Math.round(
      totalExpense /
        filteredTransactions.length
    );
  }, [
    totalExpense,
    filteredTransactions.length,
  ]);

  // ====================================================
  // CHART DATA
  // ====================================================

  const chartData = useMemo(() => {
    const data =
      chartPoints.map(
        (point) => ({
          ...point,
          expense: 0,
        })
      );

    filteredTransactions.forEach(
      (transaction) => {
        const transDate =
          new Date(
            transaction.date
          );

        if (
          isNaN(
            transDate.getTime()
          )
        ) {
          return;
        }

        const point =
          data.find((item) => {
            if (
              timeFrame ===
              "daily"
            ) {
              return (
                item.hour ===
                transDate.getHours()
              );
            }

            if (
              timeFrame ===
              "yearly"
            ) {
              return (
                item.date?.getMonth?.() ===
                transDate.getMonth()
              );
            }

            return (
              item.date?.getDate?.() ===
                transDate.getDate() &&
              item.date?.getMonth?.() ===
                transDate.getMonth()
            );
          });

        if (point) {
          point.expense += Math.round(
            Number(
              transaction.amount || 0
            )
          );
        }
      }
    );

    return data;
  }, [
    filteredTransactions,
    chartPoints,
    timeFrame,
  ]);

  // ====================================================
  // API REQUEST
  // ====================================================

  const handleApiRequest = async (
    method,
    url,
    data = null
  ) => {
    try {
      setLoading(true);

      const fullUrl =
        `${API_BASE}${url}`;

      console.log(
        "API REQUEST:",
        method.toUpperCase(),
        fullUrl
      );

      const config = {
        method,
        url: fullUrl,

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthHeaders(),
        },
      };

      if (data !== null) {
        config.data = data;
      }

      const response =
        await axios(config);

      console.log(
        "API RESPONSE:",
        response.data
      );

      if (
        typeof refreshTransactions ===
        "function"
      ) {
        await refreshTransactions();
      }

      await fetchOverview(
        timeFrame
      );

      return response;
    } catch (error) {
      console.error(
        "API REQUEST ERROR:",
        {
          method,
          url: `${API_BASE}${url}`,
          status:
            error?.response?.status,
          data:
            error?.response?.data,
          message:
            error?.message,
        }
      );

      if (
        error?.response?.status ===
        401
      ) {
        alert(
          "Session expired. Please login again."
        );
      } else {
        alert(
          error?.response?.data
            ?.message ||
            "Unable to connect to server."
        );
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // ADD EXPENSE
  // ====================================================

  const handleAddTransaction =
    async () => {
      if (
        !newTransaction.description?.trim()
      ) {
        alert(
          "Please enter description."
        );
        return;
      }

      if (
        !newTransaction.amount ||
        Number(
          newTransaction.amount
        ) <= 0
      ) {
        alert(
          "Please enter a valid amount."
        );
        return;
      }

      try {
        const payload = {
          description:
            newTransaction.description.trim(),

          amount:
            Number(
              newTransaction.amount
            ),

          category:
            newTransaction.category,

          date:
            toIsoWithClientTime(
              newTransaction.date
            ),
        };

        console.log(
          "ADDING EXPENSE:",
          payload
        );

        await handleApiRequest(
          "post",
          "/expense/add",
          payload
        );

        setNewTransaction({
          date: new Date()
            .toISOString()
            .split("T")[0],

          description: "",

          amount: "",

          type: "expense",

          category: "Food",
        });

        setShowModal(false);

        alert(
          "Expense added successfully!"
        );
      } catch (error) {
        console.error(
          "FAILED TO ADD EXPENSE:",
          error
        );
      }
    };

  // ====================================================
  // EDIT EXPENSE
  // ====================================================

  const handleEditTransaction =
    async () => {
      if (!editingId) {
        return;
      }

      if (
        !editForm.description?.trim()
      ) {
        alert(
          "Please enter description."
        );
        return;
      }

      if (
        !editForm.amount ||
        Number(editForm.amount) <= 0
      ) {
        alert(
          "Please enter a valid amount."
        );
        return;
      }

      try {
        const payload = {
          description:
            editForm.description.trim(),

          amount:
            Number(
              editForm.amount
            ),

          category:
            editForm.category,

          date:
            toIsoWithClientTime(
              editForm.date
            ),
        };

        await handleApiRequest(
          "put",
          `/expense/update/${editingId}`,
          payload
        );

        setEditingId(null);
      } catch (error) {
        console.error(
          "FAILED TO UPDATE EXPENSE:",
          error
        );
      }
    };

  // ====================================================
  // DELETE EXPENSE
  // ====================================================

  const handleDeleteTransaction =
    async (id) => {
      if (!id) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this expense?"
        );

      if (!confirmed) {
        return;
      }

      try {
        await handleApiRequest(
          "delete",
          `/expense/delete/${id}`
        );
      } catch (error) {
        console.error(
          "FAILED TO DELETE EXPENSE:",
          error
        );
      }
    };

  // ====================================================
  // EXPORT
  // ====================================================

  const handleExport = async () => {
    try {
      const response =
        await axios.get(
          `${API_BASE}/expense/downloadexcel`,
          {
            headers:
              getAuthHeaders(),

            responseType: "blob",
          }
        );

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers[
              "content-type"
            ] ||
            "application/octet-stream",
        }
      );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "expense_details.xlsx";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (error) {
      console.error(
        "EXPORT ERROR:",
        error
      );

      try {
        const exportData =
          filteredTransactions.map(
            (transaction) => ({
              Date: new Date(
                transaction.date
              ).toLocaleDateString(),

              Description:
                transaction.description,

              Category:
                transaction.category,

              Amount:
                transaction.amount,

              Type: "Expense",
            })
          );

        exportToExcel(
          exportData,
          `expenses_${new Date()
            .toISOString()
            .slice(0, 10)}`
        );
      } catch (fallbackError) {
        console.error(
          "FALLBACK EXPORT ERROR:",
          fallbackError
        );

        alert(
          "Failed to export data."
        );
      }
    }
  };

  // ====================================================
  // RETURN
  // ====================================================

  return (
    <div className={styles.container}>

      {/* HEADER */}

      <div className={styles.headerCard}>
        <div
          className={
            styles.headerContainer
          }
        >
          <div>
            <h1
              className={
                styles.headerTitle
              }
            >
              Expense Overview
            </h1>

            <p
              className={
                styles.headerSubtitle
              }
            >
              Track and manage your
              expenses
            </p>
          </div>

          <button
            onClick={() =>
              setShowModal(true)
            }
            className={
              styles.addButton
            }
            disabled={loading}
          >
            <Plus size={20} />

            {loading
              ? "Processing..."
              : "Add Expense"}
          </button>
        </div>

        <div
          className={
            styles.timeframePositioning
          }
        >
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={(frame) => {
              setTimeFrame(frame);
              setSelectedMonth(null);
            }}
            options={[
              "daily",
              "weekly",
              "monthly",
              "yearly",
            ]}
            color="orange"
          />
        </div>
      </div>

      {/* CARDS */}

      <div className={styles.cardsGrid}>

        <FinancialCard
          icon={
            <div
              className={
                styles.iconOrange
              }
            >
              <DollarSign
                className={`w-5 h-5 ${styles.textOrange}`}
              />
            </div>
          }
          label="Total Expenses"
          value={`₹${totalExpense.toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />

              {timeFrameRange.label}
            </div>
          }
          borderColor={
            styles.borderOrange
          }
        />

        <FinancialCard
          icon={
            <div
              className={
                styles.iconAmber
              }
            >
              <BarChart2
                className={`w-5 h-5 ${styles.textAmber}`}
              />
            </div>
          }
          label="Average Expense"
          value={`₹${averageExpense.toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />

              {
                filteredTransactions.length
              }{" "}
              transactions
            </div>
          }
          borderColor={
            styles.borderAmber
          }
        />

        <FinancialCard
          icon={
            <div
              className={
                styles.iconYellow
              }
            >
              <TrendingDown
                className={`w-5 h-5 ${styles.textYellow}`}
              />
            </div>
          }
          label="Transactions"
          value={
            filteredTransactions.length
          }
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />

              {filter === "all"
                ? "All records"
                : "Filtered records"}
            </div>
          }
          borderColor={
            styles.borderYellow
          }
        />

      </div>

      {/* CHART */}

      <div
        className={`${styles.chartContainer} min-h-[350px]`}
      >
        <div
          className={
            styles.chartHeader
          }
        >
          <h3
            className={
              styles.chartTitle
            }
          >
            <BarChart2 className="w-6 h-6 text-orange-500" />

            {timeFrame === "daily"
              ? "Hourly"
              : timeFrame === "yearly"
              ? "Monthly"
              : "Daily"}{" "}
            Expense Trends

            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>

          <button
            onClick={handleExport}
            className={
              styles.chartExportButton
            }
          >
            <Download size={18} />
            Export Data
          </button>
        </div>

        {/* IMPORTANT:
            Chart wrapper has explicit height */}
        <div
          className={`${styles.chartHeight} h-[300px] min-h-[300px] w-full`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
          >
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#ff9800"
                    stopOpacity={0.8}
                  />

                  <stop
                    offset="95%"
                    stopColor="#ff9800"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={60}
                tickFormatter={(value) =>
                  `₹${Number(
                    value
                  ).toLocaleString()}`
                }
              />

              <Tooltip
                formatter={(value) => [
                  `₹${Math.round(
                    Number(value)
                  ).toLocaleString()}`,
                  "Expense",
                ]}
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ff9800"
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />

              {chartData.map(
                (point, index) =>
                  point.isCurrent && (
                    <ReferenceLine
                      key={`reference-${index}`}
                      x={point.label}
                      stroke="#ff5722"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  )
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TRANSACTIONS */}

      <div
        className={
          styles.transactionsContainer
        }
      >
        <div
          className={
            styles.transactionsHeader
          }
        >
          <h3
            className={
              styles.transactionsTitle
            }
          >
            <DollarSign className="w-6 h-6 text-orange-500" />

            Expense Transactions

            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">

            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value
                )
              }
              className={
                styles.filterSelect
              }
            >
              <option value="all">
                All Transactions
              </option>

              <option value="month">
                This Month
              </option>

              <option value="year">
                This Year
              </option>

              <option value="Food">
                Food
              </option>

              <option value="Housing">
                Housing
              </option>

              <option value="Transport">
                Transport
              </option>

              <option value="Shopping">
                Shopping
              </option>

              <option value="Entertainment">
                Entertainment
              </option>

              <option value="Utilities">
                Utilities
              </option>

              <option value="Healthcare">
                Healthcare
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <button
              onClick={handleExport}
              className={
                styles.exportButton
              }
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div
          className={
            styles.transactionsList
          }
        >
          {filteredTransactions
            .slice(
              0,
              showAll
                ? filteredTransactions.length
                : 8
            )
            .map(
              (transaction) => (
                <TransactionItem
                  key={
                    transaction.id ||
                    transaction._id
                  }
                  transaction={
                    transaction
                  }
                  isEditing={
                    editingId ===
                    (
                      transaction.id ||
                      transaction._id
                    )
                  }
                  editForm={
                    editForm
                  }
                  setEditForm={
                    setEditForm
                  }
                  onSave={
                    handleEditTransaction
                  }
                  onCancel={() =>
                    setEditingId(
                      null
                    )
                  }
                  onDelete={
                    handleDeleteTransaction
                  }
                  type="expense"
                  categoryIcons={
                    CATEGORY_ICONS
                  }
                  setEditingId={
                    setEditingId
                  }
                  containerClass={
                    styles.transactionItemContainer
                  }
                  amountClass={
                    styles.transactionAmount
                  }
                  iconClass={
                    styles.transactionIcon
                  }
                />
              )
            )}

          {!showAll &&
            filteredTransactions.length >
              8 && (
              <button
                onClick={() =>
                  setShowAll(true)
                }
                className={
                  styles.viewAllButton
                }
              >
                <Eye size={18} />

                View All{" "}
                {
                  filteredTransactions.length
                }{" "}
                Transactions
              </button>
            )}

          {filteredTransactions.length ===
            0 && (
            <div
              className={
                styles.emptyState
              }
            >
              <div
                className={
                  styles.emptyStateIcon
                }
              >
                <DollarSign className="w-8 h-8 text-orange-400" />
              </div>

              <p
                className={
                  styles.emptyStateText
                }
              >
                No expense
                transactions found
              </p>

              <p
                className={
                  styles.emptyStateSubtext
                }
              >
                {filter === "all"
                  ? "You haven't recorded any expenses yet"
                  : `No ${filter} transactions found`}
              </p>

              <button
                onClick={() =>
                  setShowModal(true)
                }
                className={
                  styles.addButton
                }
              >
                <Plus size={20} />

                Add Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}

      <AddTransactionModal
        showModal={showModal}
        setShowModal={
          setShowModal
        }
        newTransaction={
          newTransaction
        }
        setNewTransaction={
          setNewTransaction
        }
        handleAddTransaction={
          handleAddTransaction
        }
        loading={loading}
        type="expense"
        title="Add New Expense"
        buttonText="Add Expense"
        categories={[
          "Food",
          "Housing",
          "Transport",
          "Shopping",
          "Entertainment",
          "Utilities",
          "Healthcare",
          "Other",
        ]}
        color="orange"
      />
    </div>
  );
};

export default ExpensePage;