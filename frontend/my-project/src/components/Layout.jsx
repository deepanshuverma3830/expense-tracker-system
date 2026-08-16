import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { styles } from "../assets/dummyStyles";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import {
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Car,
  Clock,
  CreditCard,
  DollarSign,
  Gift,
  Home,
  PiggyBank,
  ShoppingCart,
  TrendingUp,
  Utensils,
  Zap,
  ChevronUp,
  ChevronDown,
  PieChart,
  Activity,
} from "lucide-react";

import axios from "axios";
import { Outlet } from "react-router-dom";

const API_BASE = "http://localhost:1234/api";

// ======================================================
// CATEGORY ICONS
// ======================================================

const CATEGORY_ICONS = {
  Food: <Utensils className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingCart className="w-4 h-4" />,
  Entertainment: <Gift className="w-4 h-4" />,
  Utilities: <Zap className="w-4 h-4" />,
  Healthcare: <Activity className="w-4 h-4" />,
  Salary: <ArrowUp className="w-4 h-4" />,
  Freelance: <CreditCard className="w-4 h-4" />,
  Savings: <PiggyBank className="w-4 h-4" />,
};

// ======================================================
// FILTER TRANSACTIONS
// ======================================================

const filterTransactions = (transactions, frame) => {
  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (frame) {
    case "daily":
      return transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= today;
      });

    case "weekly": {
      const startOfWeek = new Date(today);

      startOfWeek.setDate(
        startOfWeek.getDate() - startOfWeek.getDay()
      );

      return transactions.filter((t) => {
        const date = new Date(t.date);
        return date >= startOfWeek;
      });
    }

    case "monthly":
      return transactions.filter((t) => {
        const date = new Date(t.date);

        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });

    case "yearly":
      return transactions.filter((t) => {
        const date = new Date(t.date);

        return (
          date.getFullYear() === now.getFullYear()
        );
      });

    default:
      return transactions;
  }
};

// ======================================================
// SAFE RESPONSE ARRAY
// ======================================================

const safeArrayFromResponse = (res) => {
  const body = res?.data;

  if (!body) return [];

  // response itself is array
  if (Array.isArray(body)) {
    return body;
  }

  // { data: [] }
  if (Array.isArray(body.data)) {
    return body.data;
  }

  // { incomes: [] }
  if (Array.isArray(body.incomes)) {
    return body.incomes;
  }

  // { income: [] }
  if (Array.isArray(body.income)) {
    return body.income;
  }

  // { expenses: [] }
  if (Array.isArray(body.expenses)) {
    return body.expenses;
  }

  // { expense: [] }
  if (Array.isArray(body.expense)) {
    return body.expense;
  }

  return [];
};

// ======================================================
// LAYOUT
// ======================================================

const Layout = ({
  children,
  onLogout,
  user,
}) => {
  const [transactions, setTransactions] =
    useState([]);

  const [timeFrame, setTimeFrame] =
    useState("monthly");

  const [loading, setLoading] =
    useState(false);

  const [showAllTransactions, setShowAllTransactions] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [isCollapsed, setCollapsed] =
    useState(false);

  // ====================================================
  // AUTH HEADERS
  // ====================================================

  const getAuthHeaders = useCallback(() => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("authheader") ||
      sessionStorage.getItem("authheader");

    console.log("LAYOUT TOKEN:", token);

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
  // FETCH ALL TRANSACTIONS
  // ====================================================

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const headers = getAuthHeaders();

      console.log(
        "FETCHING TRANSACTIONS..."
      );

      // IMPORTANT:
      // Promise.allSettled is used so that
      // income failure doesn't stop expense loading.

      const results =
        await Promise.allSettled([
          axios.get(
            `${API_BASE}/income/get`,
            { headers }
          ),

          axios.get(
            `${API_BASE}/expense/get`,
            { headers }
          ),
        ]);

      const incomeResult = results[0];
      const expenseResult = results[1];

      // ==================================================
      // INCOME
      // ==================================================

      let incomes = [];

      if (
        incomeResult.status ===
        "fulfilled"
      ) {
        console.log(
          "INCOME RESPONSE:",
          incomeResult.value.data
        );

        incomes =
          safeArrayFromResponse(
            incomeResult.value
          ).map((income) => ({
            ...income,
            type: "income",
          }));
      } else {
        console.error(
          "INCOME FETCH ERROR:",
          incomeResult.reason?.response
            ?.status,
          incomeResult.reason?.response
            ?.data
        );
      }

      // ==================================================
      // EXPENSE
      // ==================================================

      let expenses = [];

      if (
        expenseResult.status ===
        "fulfilled"
      ) {
        console.log(
          "EXPENSE RESPONSE:",
          expenseResult.value.data
        );

        expenses =
          safeArrayFromResponse(
            expenseResult.value
          ).map((expense) => ({
            ...expense,
            type: "expense",
          }));
      } else {
        console.error(
          "EXPENSE FETCH ERROR:",
          expenseResult.reason?.response
            ?.status,
          expenseResult.reason?.response
            ?.data
        );
      }

      // ==================================================
      // COMBINE
      // ==================================================

      const allTransactions = [
        ...incomes,
        ...expenses,
      ]
        .map((transaction) => ({
          id:
            transaction._id ||
            transaction.id ||
            transaction.id_str ||
            Math.random()
              .toString(36)
              .slice(2),

          description:
            transaction.description ||
            transaction.title ||
            transaction.note ||
            "",

          amount:
            transaction.amount != null
              ? Number(transaction.amount)
              : Number(transaction.value) ||
                0,

          date:
            transaction.date ||
            transaction.createdAt ||
            new Date().toISOString(),

          category:
            transaction.category ||
            "Other",

          type:
            transaction.type,

          raw: transaction,
        }))
        .sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );

      console.log(
        "ALL TRANSACTIONS:",
        allTransactions
      );

      // THIS IS IMPORTANT
      setTransactions(
        allTransactions
      );

      setLastUpdated(
        new Date()
      );
    } catch (error) {
      console.error(
        "FETCH TRANSACTIONS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // ====================================================
  // ADD TRANSACTION
  // ====================================================

  const addTransaction = async (
    transaction
  ) => {
    try {
      const headers =
        getAuthHeaders();

      const endpoint =
        transaction.type ===
        "income"
          ? "income/add"
          : "expense/add";

      const response =
        await axios.post(
          `${API_BASE}/${endpoint}`,
          transaction,
          { headers }
        );

      console.log(
        "ADD TRANSACTION RESPONSE:",
        response.data
      );

      await fetchTransactions();

      return true;
    } catch (err) {
      console.error(
        "FAILED TO ADD TRANSACTION:",
        err?.response?.data ||
          err.message ||
          err
      );

      throw err;
    }
  };

  // ====================================================
  // UPDATE TRANSACTION
  // ====================================================

  const editTransaction = async (
    id,
    transaction
  ) => {
    try {
      const headers =
        getAuthHeaders();

      const endpoint =
        transaction.type ===
        "income"
          ? "income/update"
          : "expense/update";

      const response =
        await axios.put(
          `${API_BASE}/${endpoint}/${id}`,
          transaction,
          { headers }
        );

      console.log(
        "UPDATE TRANSACTION RESPONSE:",
        response.data
      );

      await fetchTransactions();

      return true;
    } catch (err) {
      console.error(
        "FAILED TO UPDATE TRANSACTION:",
        err?.response?.data ||
          err.message ||
          err
      );

      throw err;
    }
  };

  // ====================================================
  // DELETE TRANSACTION
  // ====================================================

  const deleteTransaction = async (
    id,
    type
  ) => {
    try {
      const headers =
        getAuthHeaders();

      const endpoint =
        type === "income"
          ? "income/delete"
          : "expense/delete";

      const response =
        await axios.delete(
          `${API_BASE}/${endpoint}/${id}`,
          { headers }
        );

      console.log(
        "DELETE TRANSACTION RESPONSE:",
        response.data
      );

      await fetchTransactions();

      return true;
    } catch (err) {
      console.error(
        "FAILED TO DELETE TRANSACTION:",
        err?.response?.data ||
          err.message ||
          err
      );

      throw err;
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ====================================================
  // FILTERED TRANSACTIONS
  // ====================================================

  const filteredTransactions =
    useMemo(() => {
      return filterTransactions(
        transactions,
        timeFrame
      );
    }, [
      transactions,
      timeFrame,
    ]);

  // ====================================================
  // STATS
  // ====================================================

  const stats = useMemo(() => {
    const now = new Date();

    const thirtyDaysAgo =
      new Date(now);

    thirtyDaysAgo.setDate(
      now.getDate() - 30
    );

    // Last 30 days
    const last30DaysTransactions =
      transactions.filter(
        (t) =>
          new Date(t.date) >=
          thirtyDaysAgo
      );

    const last30DaysIncome =
      last30DaysTransactions
        .filter(
          (t) =>
            t.type ===
            "income"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

    const last30DaysExpenses =
      last30DaysTransactions
        .filter(
          (t) =>
            t.type ===
            "expense"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

    // All time
    const allTimeIncome =
      transactions
        .filter(
          (t) =>
            t.type ===
            "income"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

    const allTimeExpenses =
      transactions
        .filter(
          (t) =>
            t.type ===
            "expense"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

    const last30DaysSavings =
      last30DaysIncome -
      last30DaysExpenses;

    const allTimeSavings =
      allTimeIncome -
      allTimeExpenses;

    // Saving rate
    const savingsRate =
      last30DaysIncome > 0
        ? Math.round(
            (last30DaysSavings /
              last30DaysIncome) *
              100
          )
        : 0;

    // Previous 30 days
    const last60DaysAgo =
      new Date(now);

    last60DaysAgo.setDate(
      now.getDate() - 60
    );

    const previous30DaysTransactions =
      transactions.filter(
        (t) => {
          const date =
            new Date(t.date);

          return (
            date >=
              last60DaysAgo &&
            date < thirtyDaysAgo
          );
        }
      );

    const previous30DaysExpenses =
      previous30DaysTransactions
        .filter(
          (t) =>
            t.type ===
            "expense"
        )
        .reduce(
          (sum, t) =>
            sum +
            Number(t.amount || 0),
          0
        );

    const expenseChange =
      previous30DaysExpenses >
      0
        ? Math.round(
            ((last30DaysExpenses -
              previous30DaysExpenses) /
              previous30DaysExpenses) *
              100
          )
        : 0;

    return {
      totalTransactions:
        transactions.length,

      last30DaysIncome,

      last30DaysExpenses,

      last30DaysSavings,

      allTimeIncome,

      allTimeExpenses,

      allTimeSavings,

      last30DaysCount:
        last30DaysTransactions.length,

      savingsRate,

      expenseChange,
    };
  }, [transactions]);

  // ====================================================
  // TIME FRAME LABEL
  // ====================================================

  const timeFrameLabel =
    useMemo(() => {
      if (timeFrame === "daily") {
        return "Today";
      }

      if (timeFrame === "weekly") {
        return "This Week";
      }

      if (timeFrame === "yearly") {
        return "This Year";
      }

      return "This Month";
    }, [timeFrame]);

  // ====================================================
  // OUTLET CONTEXT
  // ====================================================

  const outletContext = {
    transactions:
      filteredTransactions,

    addTransaction,

    editTransaction,

    deleteTransaction,

    refreshTransactions:
      fetchTransactions,

    timeFrame,

    setTimeFrame,

    lastUpdated,
  };

  // ====================================================
  // SAVINGS RATING
  // ====================================================

  const getSavingsRating = (
    rate
  ) => {
    if (rate > 30) {
      return "Excellent";
    }

    if (rate > 20) {
      return "Good";
    }

    return "Needs improvement";
  };

  // ====================================================
  // TOP CATEGORIES
  // ====================================================

  const topCategories =
    useMemo(() => {
      return Object.entries(
        transactions
          .filter(
            (t) =>
              t.type ===
              "expense"
          )
          .reduce(
            (acc, t) => {
              const category =
                t.category ||
                "Other";

              acc[category] =
                (acc[category] ||
                  0) +
                Number(
                  t.amount || 0
                );

              return acc;
            },
            {}
          )
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 5);
    }, [transactions]);

  // ====================================================
  // DISPLAYED TRANSACTIONS
  // ====================================================

  const displayedTransactions =
    showAllTransactions
      ? transactions
      : transactions.slice(
          0,
          4
        );

  // ====================================================
  // RETURN
  // ====================================================

  return (
    <div className={styles.layout.root}>
      {/* NAVBAR */}
      <Navbar
        user={user}
        onLogout={onLogout}
      />

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        isCollapsed={isCollapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={styles.layout.mainContainer(
          isCollapsed
        )}
      >
        {/* HEADER */}
        <div
          className={
            styles.header.container
          }
        >
          <div>
            <h1
              className={
                styles.header.title
              }
            >
              Dashboard
            </h1>

            <p
              className={
                styles.header.subtitle
              }
            >
              Welcome back
            </p>
          </div>
        </div>

        {/* ==================================================
            STAT CARDS
        ================================================== */}

        <div
          className={
            styles.statCards.grid
          }
        >
          {/* TOTAL BALANCE */}
          <div
            className={
              styles.statCards.card
            }
          >
            <div
              className={
                styles.statCards.cardHeader
              }
            >
              <div>
                <p
                  className={
                    styles.statCards.cardTitle
                  }
                >
                  Total Balance
                </p>

                <p
                  className={
                    styles.statCards.cardValue
                  }
                >
                  $
                  {stats.allTimeSavings.toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>

              <div
                className={styles.statCards.iconContainer(
                  "teal"
                )}
              >
                <DollarSign
                  className={styles.statCards.icon(
                    "teal"
                  )}
                />
              </div>
            </div>

            <p
              className={
                styles.statCards.cardFooter
              }
            >
              <span className="text-teal-600 font-medium">
                +
                {stats.last30DaysCount.toLocaleString()}
              </span>{" "}
              transactions in last 30 days
            </p>
          </div>

          {/* MONTHLY INCOME */}
          <div
            className={
              styles.statCards.card
            }
          >
            <div
              className={
                styles.statCards.cardHeader
              }
            >
              <div>
                <p
                  className={
                    styles.statCards.cardTitle
                  }
                >
                  Monthly Income
                </p>

                <p
                  className={
                    styles.statCards.cardValue
                  }
                >
                  $
                  {stats.last30DaysIncome.toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>

              <div
                className={styles.statCards.iconContainer(
                  "green"
                )}
              >
                <ArrowUp
                  className={styles.statCards.icon(
                    "green"
                  )}
                />
              </div>
            </div>

            <p
              className={
                styles.statCards.cardFooter
              }
            >
              Last 30 days
            </p>
          </div>

          {/* MONTHLY EXPENSES */}
          <div
            className={
              styles.statCards.card
            }
          >
            <div
              className={
                styles.statCards.cardHeader
              }
            >
              <div>
                <p
                  className={
                    styles.statCards.cardTitle
                  }
                >
                  Monthly Expenses
                </p>

                <p
                  className={
                    styles.statCards.cardValue
                  }
                >
                  $
                  {stats.last30DaysExpenses.toLocaleString(
                    "en-US",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </p>
              </div>

              <div
                className={styles.statCards.iconContainer(
                  "orange"
                )}
              >
                <ArrowDown
                  className={styles.statCards.icon(
                    "orange"
                  )}
                />
              </div>
            </div>

            <p
              className={
                styles.statCards.cardFooter
              }
            >
              <span
                className={`${styles.colors.expenseChange(
                  stats.expenseChange
                )} font-medium`}
              >
                {stats.expenseChange > 0
                  ? "+"
                  : ""}
                {stats.expenseChange}%
              </span>{" "}
              from previous 30 days
            </p>
          </div>

          {/* SAVING RATE */}
          <div
            className={
              styles.statCards.card
            }
          >
            <div
              className={
                styles.statCards.cardHeader
              }
            >
              <div>
                <p
                  className={
                    styles.statCards.cardTitle
                  }
                >
                  Saving Rate
                </p>

                <p
                  className={
                    styles.statCards.cardValue
                  }
                >
                  {stats.savingsRate}%
                </p>
              </div>

              <div
                className={styles.statCards.iconContainer(
                  "blue"
                )}
              >
                <PiggyBank
                  className={styles.statCards.icon(
                    "blue"
                  )}
                />
              </div>
            </div>

            <p
              className={
                styles.statCards.cardFooter
              }
            >
              {getSavingsRating(
                stats.savingsRate
              )}
            </p>
          </div>
        </div>

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <div
          className={
            styles.grid.main
          }
        >
          {/* LEFT */}
          <div
            className={
              styles.grid.leftColumn
            }
          >
            <div
              className={
                styles.cards.base
              }
            >
              <div
                className={
                  styles.cards.header
                }
              >
                <h3
                  className={
                    styles.cards.title
                  }
                >
                  <TrendingUp className="w-6 h-6 text-teal-500" />

                  Financial Overview

                  <span className="text-sm text-gray-500">
                    {" "}
                    {timeFrameLabel}
                  </span>
                </h3>
              </div>

              <Outlet
                context={
                  outletContext
                }
              />
            </div>
          </div>

          {/* RIGHT */}
          <div
            className={
              styles.grid.rightColumn
            }
          >
            {/* RECENT TRANSACTIONS */}
            <div
              className={
                styles.cards.base
              }
            >
              <div
                className={
                  styles.transactions.cardHeader
                }
              >
                <h3
                  className={
                    styles.transactions.cardTitle
                  }
                >
                  <Clock className="w-6 h-6 text-purple-500" />

                  Recent Transactions
                </h3>

                <button
                  onClick={
                    fetchTransactions
                  }
                  disabled={loading}
                  className={
                    styles.transactions.refreshButton
                  }
                >
                  <RefreshCw
                    className={styles.transactions.refreshIcon(
                      loading
                    )}
                  />
                </button>
              </div>

              <div
                className={
                  styles.transactions.dataStackingInfo
                }
              >
                <div
                  className={
                    styles.transactions.dataStackingIcon
                  }
                />

                <span>
                  Transactions are
                  stacked by date
                  (newest first)
                </span>
              </div>

              <div
                className={
                  styles.transactions.listContainer
                }
              >
                {displayedTransactions.map(
                  (transaction) => {
                    const {
                      id,
                      type,
                      category,
                      description,
                      date,
                      amount,
                    } = transaction;

                    return (
                      <div
                        key={id}
                        className={
                          styles.transactions.transactionItem
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              styles.colors.transaction.bg(
                                type
                              )
                            }`}
                          >
                            {CATEGORY_ICONS[
                              category
                            ] || (
                              <DollarSign
                                className={
                                  styles.transactions.icon
                                }
                              />
                            )}
                          </div>

                          <div
                            className={
                              styles.transactions.details
                            }
                          >
                            <div
                              className={
                                styles.transactions.description
                              }
                            >
                              {description}

                              <div
                                className={
                                  styles.transactions.meta
                                }
                              >
                                {new Date(
                                  date
                                ).toLocaleDateString()}

                                <span className="ml-2 capitalize">
                                  {category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <span
                          className={styles.colors.transaction.text(
                            type
                          )}
                        >
                          {type ===
                          "income"
                            ? "+"
                            : "-"}
                          $
                          {Number(
                            amount || 0
                          ).toLocaleString(
                            "en-US"
                          )}
                        </span>
                      </div>
                    );
                  }
                )}

                {/* EMPTY */}
                {transactions.length ===
                  0 && (
                  <div
                    className={
                      styles.transactions.emptyState
                    }
                  >
                    <div
                      className={
                        styles.transactions.emptyIcon
                      }
                    />

                    <p
                      className={
                        styles.transactions.emptyText
                      }
                    >
                      No recent
                      transactions
                    </p>
                  </div>
                )}

                {/* VIEW ALL */}
                {transactions.length >
                  0 && (
                  <div
                    className={
                      styles.transactions.viewAllContainer
                    }
                  >
                    <button
                      onClick={() =>
                        setShowAllTransactions(
                          !showAllTransactions
                        )
                      }
                    >
                      {showAllTransactions ? (
                        <>
                          <ChevronUp className="w-5 h-5" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-5 h-5" />
                          View All Transactions (
                          {
                            transactions.length
                          }
                          )
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SPENDING BY CATEGORY */}
            <div
              className={
                styles.cards.base
              }
            >
              <h3
                className={
                  styles.categories.title
                }
              >
                <PieChart
                  className={
                    styles.categories.titleIcon
                  }
                />

                Spending By Category
              </h3>

              <div
                className={
                  styles.categories.list
                }
              >
                {topCategories.map(
                  ([
                    category,
                    amount,
                  ]) => (
                    <div
                      key={category}
                      className={
                        styles.categories.categoryItem
                      }
                    >
                      <div
                        className={
                          styles.categories.categoryIconContainer
                        }
                      >
                        {CATEGORY_ICONS[
                          category
                        ] || (
                          <DollarSign
                            className={
                              styles.categories.categoryIcon
                            }
                          />
                        )}
                      </div>

                      <span
                        className={
                          styles.categories.categoryName
                        }
                      >
                        {category}
                      </span>

                      <span
                        className={
                          styles.categories.categoryAmount
                        }
                      >
                        $
                        {Number(
                          amount || 0
                        ).toLocaleString(
                          "en-US"
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* SUMMARY */}
              <div
                className={
                  styles.categories.summaryContainer
                }
              >
                <div
                  className={
                    styles.categories.summaryGrid
                  }
                >
                  <div
                    className={
                      styles.categories.summaryIncomeCard
                    }
                  >
                    <p
                      className={
                        styles.categories.summaryTitle
                      }
                    >
                      Total Income
                    </p>

                    <p
                      className={
                        styles.categories.summaryValue
                      }
                    >
                      $
                      {stats.allTimeIncome.toLocaleString(
                        "en-US"
                      )}
                    </p>
                  </div>

                  <div
                    className={
                      styles.categories.summaryExpenseCard
                    }
                  >
                    <p
                      className={
                        styles.categories.summaryTitle
                      }
                    >
                      Total Expenses
                    </p>

                    <p
                      className={
                        styles.categories.summaryValue
                      }
                    >
                      $
                      {stats.allTimeExpenses.toLocaleString(
                        "en-US"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHILDREN */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;