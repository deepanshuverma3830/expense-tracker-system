import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  dashboardStyles,
  trendStyles,
  chartStyles,
} from "../assets/dummyStyles";

import {
  GAUGE_COLORS,
  COLORS,
  INCOME_CATEGORY_ICONS,
  EXPENSE_CATEGORY_ICONS,
} from "../assets/Color";

import { useOutletContext } from "react-router-dom";

import {
  getTimeFrameRange,
  getPreviousTimeFrameRange,
  calculateData,
} from "../components/Helpers";

import {
  ArrowDown,
  PieChart as PieChartIcon,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  DollarSign,
  ShoppingCart,
} from "lucide-react";

import FinancialCard from "../components/FinancialCard";
import GaugeCard from "../components/GaugeCard";
import AddTransactionModal from "../components/Add";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";


// =====================================================
// API
// =====================================================

const API_BASE = "http://localhost:1234/api";


// =====================================================
// AUTH HEADER
// =====================================================

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authheader") ||
    sessionStorage.getItem("authheader");

  console.log("TOKEN BEING SENT:", token);

  if (!token) {
    console.warn("NO TOKEN FOUND");
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};


// =====================================================
// DATE HELPER
// =====================================================

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

  const parsedDate = new Date(dateValue);

  if (isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
}


// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {
  const outletContext = useOutletContext() || {};

  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
  } = outletContext;


  // ===================================================
  // STATE
  // ===================================================

  const [showModal, setShowModal] = useState(false);

  const [gaugeData, setGaugeData] = useState([]);

  const [loading, setLoading] = useState(false);

  const [overviewMeta, setOverviewMeta] = useState({});

  const [showAllIncome, setShowAllIncome] =
    useState(false);

  const [showAllExpense, setShowAllExpense] =
    useState(false);


  const [newTransaction, setNewTransaction] =
    useState({
      date: new Date()
        .toISOString()
        .split("T")[0],

      description: "",

      amount: "",

      type: "expense",

      category: "Food",
    });


  // ===================================================
  // TIME FRAME
  // ===================================================

  const timeFrameRange = useMemo(() => {
    return getTimeFrameRange(timeFrame);
  }, [timeFrame]);


  const prevTimeFrameRange = useMemo(() => {
    return getPreviousTimeFrameRange(timeFrame);
  }, [timeFrame]);


  // ===================================================
  // DATE RANGE CHECK
  // ===================================================

  const isDateInRange = (
    date,
    start,
    end
  ) => {
    const transactionDate = new Date(date);

    const startDate = new Date(start);

    const endDate = new Date(end);

    if (
      isNaN(transactionDate.getTime()) ||
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
      transactionDate >= startDate &&
      transactionDate <= endDate
    );
  };


  // ===================================================
  // FILTER TRANSACTIONS
  // ===================================================

  const filteredTransactions = useMemo(() => {
    return (
      outletTransactions || []
    ).filter((transaction) =>
      isDateInRange(
        transaction.date,
        timeFrameRange.start,
        timeFrameRange.end
      )
    );
  }, [
    outletTransactions,
    timeFrameRange,
  ]);


  const prevFilteredTransactions = useMemo(() => {
    return (
      outletTransactions || []
    ).filter((transaction) =>
      isDateInRange(
        transaction.date,
        prevTimeFrameRange.start,
        prevTimeFrameRange.end
      )
    );
  }, [
    outletTransactions,
    prevTimeFrameRange,
  ]);


  // ===================================================
  // CURRENT DATA
  // ===================================================

  const currentTimeFrameData =
    useMemo(() => {
      const data = calculateData(
        filteredTransactions
      );

      data.savings =
        data.income - data.expenses;

      return data;
    }, [filteredTransactions]);


  // ===================================================
  // PREVIOUS DATA
  // ===================================================

  const prevTimeFrameData =
    useMemo(() => {
      const data = calculateData(
        prevFilteredTransactions
      );

      data.savings =
        data.income - data.expenses;

      return data;
    }, [prevFilteredTransactions]);


  // ===================================================
  // GAUGE DATA
  // ===================================================

  useEffect(() => {
    const maxValues = {
      income: Math.max(
        currentTimeFrameData.income,
        5000
      ),

      expenses: Math.max(
        currentTimeFrameData.expenses,
        3000
      ),

      savings: Math.max(
        Math.abs(
          currentTimeFrameData.savings
        ),
        2000
      ),
    };


    setGaugeData([
      {
        name: "Income",
        value:
          currentTimeFrameData.income,
        max: maxValues.income,
      },

      {
        name: "Spent",
        value:
          currentTimeFrameData.expenses,
        max: maxValues.expenses,
      },

      {
        name: "Savings",
        value:
          currentTimeFrameData.savings,
        max: maxValues.savings,
      },
    ]);
  }, [currentTimeFrameData]);


  // ===================================================
  // DISPLAY VALUES
  // ===================================================

  const displayIncome =
    timeFrame === "monthly" &&
    typeof overviewMeta.monthlyIncome ===
      "number"
      ? overviewMeta.monthlyIncome
      : currentTimeFrameData.income;


  const displayExpenses =
    timeFrame === "monthly" &&
    typeof overviewMeta.monthlyExpense ===
      "number"
      ? overviewMeta.monthlyExpense
      : currentTimeFrameData.expenses;


  const displaySavings =
    timeFrame === "monthly" &&
    typeof overviewMeta.savings ===
      "number"
      ? overviewMeta.savings
      : currentTimeFrameData.savings;


  // ===================================================
  // EXPENSE CHANGE
  // ===================================================

  const expenseChange = useMemo(() => {
    const previous =
      prevTimeFrameData.expenses;

    const current =
      displayExpenses;

    if (!previous) {
      return current ? 100 : 0;
    }

    return Math.round(
      ((current - previous) /
        previous) *
        100
    );
  }, [
    prevTimeFrameData.expenses,
    displayExpenses,
  ]);


  // ===================================================
  // EXPENSE DISTRIBUTION
  // ===================================================

  const financialOverviewData =
    useMemo(() => {

      if (
        timeFrame === "monthly" &&
        Array.isArray(
          overviewMeta.expenseDistribution
        ) &&
        overviewMeta.expenseDistribution
          .length > 0
      ) {
        return overviewMeta.expenseDistribution.map(
          (item) => ({
            name:
              item.category ||
              "Other",

            value: Math.round(
              Number(item.amount) || 0
            ),
          })
        );
      }


      const categories = {};


      filteredTransactions.forEach(
        (transaction) => {

          if (
            transaction.type !==
            "expense"
          ) {
            return;
          }


          const category =
            transaction.category ||
            "Other";


          const amount =
            Number(
              transaction.amount
            ) || 0;


          categories[category] =
            (categories[category] || 0) +
            amount;
        }
      );


      return Object.keys(
        categories
      ).map((category) => ({
        name: category,

        value: Math.round(
          categories[category]
        ),
      }));

    }, [
      filteredTransactions,
      overviewMeta.expenseDistribution,
      timeFrame,
    ]);


  // ===================================================
  // SERVER RECENT TRANSACTIONS
  // ===================================================

  const serverRecent =
    Array.isArray(
      overviewMeta.recentTransactions
    )
      ? overviewMeta.recentTransactions
      : [];


  const serverRecentIncome =
    serverRecent
      .filter(
        (transaction) =>
          transaction.type ===
          "income"
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );


  const serverRecentExpense =
    serverRecent
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


  // ===================================================
  // INCOME TRANSACTIONS
  // ===================================================

  const incomeTransactions =
    useMemo(() => {
      return filteredTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            "income"
        )
        .sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );
    }, [filteredTransactions]);


  // ===================================================
  // EXPENSE TRANSACTIONS
  // ===================================================

  const expenseTransactions =
    useMemo(() => {
      return filteredTransactions
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
    }, [filteredTransactions]);


  // ===================================================
  // DISPLAY LIST
  // ===================================================

  const incomeListForDisplay =
    timeFrame === "monthly" &&
    serverRecentIncome.length > 0
      ? serverRecentIncome
      : incomeTransactions;


  const expenseListForDisplay =
    timeFrame === "monthly" &&
    serverRecentExpense.length > 0
      ? serverRecentExpense
      : expenseTransactions;


  const displayedIncome =
    showAllIncome
      ? incomeListForDisplay
      : incomeListForDisplay.slice(
          0,
          3
        );


  const displayedExpense =
    showAllExpense
      ? expenseListForDisplay
      : expenseListForDisplay.slice(
          0,
          3
        );


  // ===================================================
  // FETCH DASHBOARD OVERVIEW
  // ===================================================

  const fetchDashboardOverview =
    async () => {

      try {
        setLoading(true);


        const res =
          await axios.get(
            `${API_BASE}/dashboard`,
            {
              headers:
                getAuthHeader(),
            }
          );


        console.log(
          "DASHBOARD RESPONSE:",
          res.data
        );


        if (
          res?.data?.success
        ) {

          const data =
            res.data.data || {};


          const recent =
            Array.isArray(
              data.recentTransactions
            )
              ? data.recentTransactions.map(
                  (item) => {

                    const type =
                      item.type ||
                      (
                        item.category
                          ? "expense"
                          : "income"
                      );


                    return {
                      id:
                        item._id ||
                        item.id ||
                        `${Date.now()}-${Math.random()}`,

                      date:
                        item.date ||
                        item.createdAt ||
                        new Date().toISOString(),

                      description:
                        item.description ||
                        item.note ||
                        item.title ||
                        (
                          type ===
                          "income"
                            ? item.source ||
                              "Income"
                            : item.category ||
                              "Expense"
                        ),

                      amount:
                        Number(
                          item.amount
                        ) || 0,

                      type,

                      category:
                        item.category ||
                        (
                          type ===
                          "income"
                            ? "Salary"
                            : "Other"
                        ),

                      raw: item,
                    };
                  }
                )
              : [];


          const monthlyIncome =
            Number(
              data.monthlyIncome
            ) || 0;


          const monthlyExpense =
            Number(
              data.monthlyExpense
            ) || 0;


          const savings =
            typeof data.savings !==
            "undefined"
              ? Number(
                  data.savings
                ) || 0
              : monthlyIncome -
                monthlyExpense;


          setOverviewMeta({
            monthlyIncome,

            monthlyExpense,

            savings,

            savingsRate:
              typeof data.savingsRate !==
              "undefined"
                ? Number(
                    data.savingsRate
                  )
                : null,

            spendByCategory:
              data.spendByCategory ||
              {},

            expenseDistribution:
              Array.isArray(
                data.expenseDistribution
              )
                ? data.expenseDistribution
                : [],

            recentTransactions:
              recent,
          });


          if (
            timeFrame ===
            "monthly"
          ) {

            const maxValues = {
              income: Math.max(
                monthlyIncome,
                5000
              ),

              expenses: Math.max(
                monthlyExpense,
                3000
              ),

              savings: Math.max(
                Math.abs(
                  savings
                ),
                2000
              ),
            };


            setGaugeData([
              {
                name: "Income",
                value:
                  monthlyIncome,
                max:
                  maxValues.income,
              },

              {
                name: "Spent",
                value:
                  monthlyExpense,
                max:
                  maxValues.expenses,
              },

              {
                name: "Savings",
                value:
                  savings,
                max:
                  maxValues.savings,
              },
            ]);
          }

        } else {

          console.warn(
            "Dashboard success:false",
            res?.data
          );
        }

      } catch (err) {

        console.error(
          "Failed to fetch dashboard overview:",
          {
            status:
              err?.response?.status,

            message:
              err?.response?.data
                ?.message,

            data:
              err?.response?.data,

            url:
              err?.config?.url,
          }
        );

      } finally {

        setLoading(false);
      }
    };


  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  useEffect(() => {
    fetchDashboardOverview();
  }, []);


  // ===================================================
  // ADD TRANSACTION
  // ===================================================

  const handleAddTransaction =
    async () => {

      if (
        !newTransaction.description ||
        !newTransaction.amount
      ) {
        return;
      }


      const payload = {
        date:
          toIsoWithClientTime(
            newTransaction.date
          ),

        description:
          newTransaction.description,

        amount:
          Number(
            newTransaction.amount
          ),

        category:
          newTransaction.category,
      };


      try {

        setLoading(true);


        const headers =
          getAuthHeader();


        if (
          newTransaction.type ===
          "income"
        ) {

          await axios.post(
            `${API_BASE}/income/add`,
            payload,
            {
              headers,
            }
          );

        } else {

          await axios.post(
            `${API_BASE}/expense/add`,
            payload,
            {
              headers,
            }
          );
        }


        if (
          typeof refreshTransactions ===
          "function"
        ) {
          await refreshTransactions();
        }


        await fetchDashboardOverview();


        setNewTransaction({
          date:
            new Date()
              .toISOString()
              .split("T")[0],

          description: "",

          amount: "",

          type: "expense",

          category: "Food",
        });


        setShowModal(false);

      } catch (err) {

        console.error(
          "Failed to add transaction:",
          {
            status:
              err?.response?.status,

            message:
              err?.response?.data
                ?.message,

            data:
              err?.response?.data,
          }
        );

      } finally {

        setLoading(false);
      }
    };


  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      className={
        dashboardStyles.container
      }
    >

      {/* =========================================
          HEADER
      ========================================== */}

      <div
        className={
          dashboardStyles.headerContainer
        }
      >

        <div
          className={
            dashboardStyles.headerContent
          }
        >

          <div>

            <h1
              className={
                dashboardStyles.headerTitle
              }
            >
              Finance Dashboard
            </h1>

            <p
              className={
                dashboardStyles.headerSubtitle
              }
            >
              Track your income and expenses
            </p>

          </div>


          <button
            onClick={() =>
              setShowModal(true)
            }
            className={
              dashboardStyles.addButton
            }
          >
            <Plus size={20} />

            Add Transaction
          </button>

        </div>


        {/* TIME FRAME */}

        <div
          className={
            dashboardStyles.timeFrameContainer
          }
        >

          <div
            className={
              dashboardStyles.timeFrameWrapper
            }
          >

            {[
              "daily",
              "weekly",
              "monthly",
            ].map((frame) => (

              <button
                key={frame}
                onClick={() =>
                  setTimeFrame(frame)
                }
                className={
                  dashboardStyles.timeFrameButton(
                    timeFrame ===
                      frame
                  )
                }
              >
                {frame
                  .charAt(0)
                  .toUpperCase() +
                  frame.slice(1)}
              </button>

            ))}

          </div>

        </div>

      </div>


      {/* =========================================
          SUMMARY CARDS
      ========================================== */}

      <div
        className={
          dashboardStyles.summaryGrid
        }
      >

        {/* BALANCE */}

        <FinancialCard
          icon={
            <div
              className={
                dashboardStyles.walletIconContainer
              }
            >
              <Wallet className="w-5 h-5 text-teal-600" />
            </div>
          }

          label="Total Balance"

          value={`₹${Math.round(
            displayIncome -
              displayExpenses
          ).toLocaleString()}`}

          additionalContent={
            <div className="flex items-center gap-2 mt-2">

              <span
                className={
                  dashboardStyles.balanceBadge
                }
              >
                +₹
                {Math.round(
                  displayIncome
                ).toLocaleString()}
              </span>


              <span
                className={
                  dashboardStyles.expenseBadge
                }
              >
                -₹
                {Math.round(
                  displayExpenses
                ).toLocaleString()}
              </span>

            </div>
          }
        />


        {/* EXPENSE */}

        <FinancialCard
          icon={
            <div
              className={
                dashboardStyles.arrowDownIconContainer
              }
            >
              <ArrowDown className="w-5 h-5 text-orange-600" />
            </div>
          }

          label={`${timeFrameRange.label} Expenses`}

          value={`₹${Math.round(
            displayExpenses
          ).toLocaleString()}`}

          additionalContent={
            <div
              className={`mt-2 text-xs flex items-center gap-1 ${
                expenseChange >=
                0
                  ? trendStyles.positive
                  : trendStyles.negative
              }`}
            >

              {expenseChange >=
              0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}

              <span>
                {Math.abs(
                  expenseChange
                )}
                %{" "}
                {expenseChange >=
                0
                  ? "increase"
                  : "decrease"}{" "}
                from{" "}
                {
                  prevTimeFrameRange.label
                }
              </span>

            </div>
          }
        />


        {/* SAVINGS */}

        <FinancialCard
          icon={
            <div
              className={
                dashboardStyles.piggyBankIconContainer
              }
            >
              <ArrowDown className="w-5 h-5 text-cyan-600" />
            </div>
          }

          label={`${timeFrameRange.label} Savings`}

          value={`₹${Math.round(
            displaySavings
          ).toLocaleString()}`}

          additionalContent={
            <div className="mt-2 text-xs text-cyan-600 flex items-center gap-2">

              <div className="flex items-center gap-1">

                <BarChart2 className="w-4 h-4" />

                <span>
                  {displayIncome >
                  0
                    ? Math.round(
                        (displaySavings /
                          displayIncome) *
                          100
                      )
                    : 0}
                  % of income
                </span>

              </div>


              {typeof overviewMeta.savingsRate ===
                "number" && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    overviewMeta.savingsRate <
                    0
                      ? trendStyles.negativeRate
                      : trendStyles.positiveRate
                  }`}
                >
                  {
                    overviewMeta.savingsRate
                  }
                  %
                </span>
              )}

            </div>
          }
        />

      </div>


      {/* =========================================
          GAUGES
      ========================================== */}

      <div
        className={
          dashboardStyles.gaugeGrid
        }
      >

        {gaugeData.map(
          (gauge) => (
            <GaugeCard
              key={gauge.name}
              gauge={gauge}
              colorInfo={
                GAUGE_COLORS[
                  gauge.name
                ]
              }
              timeFrameLabel={
                timeFrameRange.label
              }
            />
          )
        )}

      </div>


      {/* =========================================
          PIE CHART
      ========================================== */}

      <div
        className={
          dashboardStyles.pieChartContainer
        }
      >

        <div
          className={
            dashboardStyles.pieChartHeader
          }
        >

          <h3
            className={
              dashboardStyles.pieChartTitle
            }
          >

            <PieChartIcon className="w-6 h-6 text-teal-500" />

            Expense Distribution

            <span
              className={
                dashboardStyles.listSubtitle
              }
            >
              {" "}
              ({timeFrameRange.label})
            </span>

          </h3>

        </div>


        {/* IMPORTANT:
            minHeight fixes Recharts width/height 0 warning
        */}

        <div
          className={`${dashboardStyles.pieChartHeight} min-h-[320px] w-full`}
        >

          {financialOverviewData.length >
          0 ? (

            <ResponsiveContainer
              width="100%"
              height={320}
              minWidth={0}
            >

              <PieChart
                className={
                  chartStyles.pieChart
                }
              >

                <Pie
                  data={
                    financialOverviewData
                  }

                  cx="50%"
                  cy="45%"

                  innerRadius={70}

                  outerRadius={110}

                  paddingAngle={2}

                  dataKey="value"

                  label={({
                    name,
                    percent,
                  }) =>
                    `${name}: ${Math.round(
                      percent * 100
                    )}%`
                  }

                  labelLine={false}
                >

                  {financialOverviewData.map(
                    (
                      entry,
                      index
                    ) => (

                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                        stroke="#fff"
                        strokeWidth={2}
                      />

                    )
                  )}

                </Pie>


                <Tooltip
                  formatter={(
                    value
                  ) => [
                    `₹${Math.round(
                      value
                    ).toLocaleString()}`,
                    "Amount",
                  ]}
                  contentStyle={
                    dashboardStyles.tooltipContent
                  }
                  itemStyle={
                    dashboardStyles.tooltipItem
                  }
                />


                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"

                  formatter={(value) => (
                    <span
                      className={
                        dashboardStyles.legendText
                      }
                    >
                      {value}
                    </span>
                  )}

                  iconSize={10}

                  iconType="circle"

                  wrapperStyle={
                    dashboardStyles.legendWrapper
                  }
                />

              </PieChart>

            </ResponsiveContainer>

          ) : (

            <div className="h-[320px] flex items-center justify-center text-gray-400">
              No expense data available
            </div>

          )}

        </div>

      </div>


      {/* =========================================
          TRANSACTION LISTS
      ========================================== */}

      <div
        className={
          dashboardStyles.listsGrid
        }
      >

        {/* =======================================
            INCOME
        ======================================== */}

        <div
          className={
            dashboardStyles.listContainer
          }
        >

          <div
            className={
              dashboardStyles.listHeader
            }
          >

            <h3
              className={
                dashboardStyles.listTitle
              }
            >

              <DollarSign className="w-6 h-6 text-green-500" />

              Recent Income{" "}

              <span
                className={
                  dashboardStyles.listSubtitle
                }
              >
                ({timeFrameRange.label})
              </span>

            </h3>


            <span
              className={
                dashboardStyles.incomeCountBadge
              }
            >
              {
                incomeListForDisplay.length
              }{" "}
              records
            </span>

          </div>


          <div
            className={
              dashboardStyles.transactionList
            }
          >

            {displayedIncome.map(
              (transaction) => {

                const IconComponent =
                  INCOME_CATEGORY_ICONS[
                    transaction.category
                  ] ||
                  INCOME_CATEGORY_ICONS.Other;


                return (

                  <div
                    key={
                      transaction.id
                    }
                    className={
                      dashboardStyles.incomeTransactionItem
                    }
                  >

                    <div
                      className={
                        dashboardStyles.transactionContent
                      }
                    >

                      <div
                        className={
                          dashboardStyles.incomeIconContainer
                        }
                      >
                        {IconComponent}
                      </div>


                      <div>

                        <p
                          className={
                            dashboardStyles.transactionDescription
                          }
                        >
                          {
                            transaction.description
                          }
                        </p>


                        <p
                          className={
                            dashboardStyles.transactionCategory
                          }
                        >
                          {
                            transaction.category
                          }
                        </p>

                      </div>

                    </div>


                    <div
                      className={
                        dashboardStyles.transactionAmount
                      }
                    >

                      <p
                        className={
                          dashboardStyles.incomeAmount
                        }
                      >
                        +₹
                        {Math.abs(
                          Number(
                            transaction.amount
                          ) || 0
                        ).toLocaleString()}
                      </p>


                      <p
                        className={
                          dashboardStyles.transactionDate
                        }
                      >
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </p>

                    </div>

                  </div>
                );
              }
            )}


            {incomeListForDisplay.length ===
              0 && (

              <div
                className={
                  dashboardStyles.emptyState
                }
              >

                <div
                  className={
                    dashboardStyles.emptyIconContainer(
                      "bg-green-50"
                    )
                  }
                >
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>


                <p
                  className={
                    dashboardStyles.emptyText
                  }
                >
                  No income transactions
                </p>

              </div>
            )}


            {incomeListForDisplay.length >
              3 && (

              <div
                className={
                  dashboardStyles.viewAllContainer
                }
              >

                <button
                  onClick={() =>
                    setShowAllIncome(
                      !showAllIncome
                    )
                  }
                  className={
                    dashboardStyles.viewAllButton
                  }
                >

                  {showAllIncome ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Income (
                      {
                        incomeListForDisplay.length
                      }
                      )
                    </>
                  )}

                </button>

              </div>
            )}

          </div>

        </div>


        {/* =======================================
            EXPENSE
        ======================================== */}

        <div
          className={
            dashboardStyles.listContainer
          }
        >

          <div
            className={
              dashboardStyles.listHeader
            }
          >

            <h3
              className="text-lg md:text-xl lg:text-xl xl:text-xl font-bold text-gray-800 md:mt-3 mt-3 flex items-center gap-3"
            >

              <ArrowDown className="w-6 h-6 text-orange-500" />

              Recent Expenses{" "}

              <span
                className={
                  dashboardStyles.listSubtitle
                }
              >
                ({timeFrameRange.label})
              </span>

            </h3>


            <span
              className={
                dashboardStyles.expenseCountBadge
              }
            >
              {
                expenseListForDisplay.length
              }{" "}
              records
            </span>

          </div>


          <div
            className={
              dashboardStyles.transactionList
            }
          >

            {displayedExpense.map(
              (transaction) => {

                const IconComponent =
                  EXPENSE_CATEGORY_ICONS[
                    transaction.category
                  ] ||
                  EXPENSE_CATEGORY_ICONS.Other;


                return (

                  <div
                    key={
                      transaction.id
                    }
                    className={
                      dashboardStyles.expenseTransactionItem
                    }
                  >

                    <div
                      className={
                        dashboardStyles.transactionContent
                      }
                    >

                      <div
                        className={
                          dashboardStyles.expenseIconContainer
                        }
                      >
                        {IconComponent}
                      </div>


                      <div>

                        <p
                          className={
                            dashboardStyles.transactionDescription
                          }
                        >
                          {
                            transaction.description
                          }
                        </p>


                        <p
                          className={
                            dashboardStyles.transactionCategory
                          }
                        >
                          {
                            transaction.category
                          }
                        </p>

                      </div>

                    </div>


                    <div
                      className={
                        dashboardStyles.transactionAmount
                      }
                    >

                      <p
                        className={
                          dashboardStyles.expenseAmount
                        }
                      >
                        -₹
                        {Math.abs(
                          Number(
                            transaction.amount
                          ) || 0
                        ).toLocaleString()}
                      </p>


                      <p
                        className={
                          dashboardStyles.transactionDate
                        }
                      >
                        {new Date(
                          transaction.date
                        ).toLocaleDateString()}
                      </p>

                    </div>

                  </div>
                );
              }
            )}


            {expenseListForDisplay.length ===
              0 && (

              <div
                className={
                  dashboardStyles.emptyState
                }
              >

                <div
                  className={
                    dashboardStyles.emptyIconContainer(
                      "bg-orange-50"
                    )
                  }
                >
                  <ShoppingCart className="w-8 h-8 text-orange-400" />
                </div>


                <p
                  className={
                    dashboardStyles.emptyText
                  }
                >
                  No expense transactions
                </p>

              </div>
            )}


            {expenseListForDisplay.length >
              3 && (

              <div
                className={
                  dashboardStyles.viewAllContainer
                }
              >

                <button
                  onClick={() =>
                    setShowAllExpense(
                      !showAllExpense
                    )
                  }
                  className={
                    dashboardStyles.viewAllButton
                  }
                >

                  {showAllExpense ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Expenses (
                      {
                        expenseListForDisplay.length
                      }
                      )
                    </>
                  )}

                </button>

              </div>
            )}

          </div>

        </div>

      </div>


      {/* =========================================
          ADD TRANSACTION MODAL
      ========================================== */}

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
      />

    </div>
  );
}


export default Dashboard;