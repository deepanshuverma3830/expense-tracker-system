import {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";

import {
  Plus,
  DollarSign,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Filter,
  BarChart2,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import { exportToExcel } from "../utils/exportUtils";
import AddTransactionModal from "../components/Add";
import TransictionItem from "../components/TransictionItem";
import TimeFrameSelector from "../components/TimeFrame";
import FinancialCard from "../components/FinancialCard";

import {
  getTimeFrameRange,
  generateChartPoints,
} from "../components/Helpers";

import {
  INCOME_COLORS,
  CATEGORY_ICONS_Inc,
} from "../assets/color";

import {
  incomeStyles as styles,
} from "../assets/dummyStyles";


// ======================================================
// API
// ======================================================

const API_BASE ="https://expense-tracker-system-2-fgq5.onrender.com/api";


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
// INCOME CHART
// ======================================================

const IncomeChart = ({
  chartData,
  timeFrame,
  timeFrameRange,
}) => {
  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeaderContainer}>
        <h3 className={styles.chartTitle}>
          <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />

          {timeFrame === "daily"
            ? "Hourly"
            : timeFrame === "yearly"
              ? "Monthly"
              : "Daily"}{" "}
          Income Trends

          <span className="text-sm text-gray-500 font-normal">
            {" "}
            ({timeFrameRange.label})
          </span>
        </h3>
      </div>

      <div className={styles.chartHeight}>
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient
                id="incomeBarGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#10b981"
                />

                <stop
                  offset="100%"
                  stopColor="#059669"
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
              tick={{
                fill: "#6b7280",
                fontSize: 12,
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#6b7280",
                fontSize: 12,
              }}
              width={50}
              tickFormatter={(value) =>
                `$${Number(value).toLocaleString()}`
              }
            />

            <Tooltip
              formatter={(value) => [
                `$${Math.round(
                  Number(value)
                ).toLocaleString()}`,
                "Income",
              ]}
              contentStyle={
                styles.tooltipContent
              }
            />

            <Bar
              dataKey="income"
              name="Income"
              radius={[6, 6, 0, 0]}
              barSize={20}
            >
              {chartData.map(
                (entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      INCOME_COLORS[
                        index %
                          INCOME_COLORS.length
                      ]
                    }
                  />
                )
              )}
            </Bar>

            {chartData.map(
              (point, index) =>
                point.isCurrent && (
                  <ReferenceLine
                    key={`reference-${index}`}
                    x={point.label}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                )
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


// ======================================================
// FILTER SECTION
// ======================================================

const FilterSection = ({
  filter,
  setFilter,
  handleExport,
}) => {
  return (
    <div className={styles.filterContainer}>
      <div className="relative w-full sm:w-auto">
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
          className={styles.filterSelect}
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

          <option value="Salary">
            Salary
          </option>

          <option value="Freelance">
            Freelance
          </option>

          <option value="Investment">
            Investment
          </option>

          <option value="Bonus">
            Bonus
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        <Filter
          className={styles.filterIcon}
        />
      </div>

      <button
        onClick={handleExport}
        className={styles.exportButton}
      >
        <Download
          size={16}
          className="md:size-4"
        />

        Export
      </button>
    </div>
  );
};


// ======================================================
// INCOME COMPONENT
// ======================================================

const Income = ({
  transactions: outletTransactions = [],
  timeFrame = "monthly",
  setTimeFrame = () => {},
  refreshTransactions,
}) => {
  const navigate = useNavigate();

  // ====================================================
  // STATES
  // ====================================================

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [showAll, setShowAll] =
    useState(false);

  const [filter, setFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(false);

  const [overview, setOverview] =
    useState({
      totalIncome: 0,
      averageIncome: 0,
      numberOfTransactions: 0,
      recentTransactions: [],
      range: "monthly",
    });

  const [newTransaction, setNewTransaction] =
    useState({
      date: new Date()
        .toISOString()
        .split("T")[0],

      description: "",

      amount: "",

      type: "income",

      category: "Salary",
    });

  const [editForm, setEditForm] =
    useState({
      description: "",
      amount: "",
      category: "Salary",

      date: new Date()
        .toISOString()
        .split("T")[0],
    });


  // ====================================================
  // AUTH HEADERS
  // ====================================================

  const getAuthHeaders =
    useCallback(() => {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      console.log(
        "========== INCOME AUTH =========="
      );

      console.log(
        "TOKEN:",
        token ? "FOUND" : "NOT FOUND"
      );

      if (!token) {
        return null;
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    }, []);


  // ====================================================
  // HANDLE 401
  // ====================================================

  const handleUnauthorized =
    useCallback(() => {
      console.log(
        "401 UNAUTHORIZED - LOGGING OUT"
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      navigate("/login", {
        replace: true,
      });
    }, [navigate]);


  // ====================================================
  // TIME FRAME
  // ====================================================

  const timeFrameRange = useMemo(
    () =>
      getTimeFrameRange(
        timeFrame,
        null
      ),
    [timeFrame]
  );


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
  // DATE RANGE
  // ====================================================

  const isDateInRange =
    useCallback(
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
          )
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
  // INCOME TRANSACTIONS
  // ====================================================

  const incomeTransactions =
    useMemo(() => {
      return (
        outletTransactions || []
      )
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
    }, [outletTransactions]);


  // ====================================================
  // TIME FRAME TRANSACTIONS
  // ====================================================

  const timeFrameTransactions =
    useMemo(() => {
      return incomeTransactions.filter(
        (transaction) =>
          isDateInRange(
            transaction.date,
            timeFrameRange.start,
            timeFrameRange.end
          )
      );
    }, [
      incomeTransactions,
      timeFrameRange,
      isDateInRange,
    ]);


  // ====================================================
  // FILTERED TRANSACTIONS
  // ====================================================

  const filteredTransactions =
    useMemo(() => {
      if (filter === "all") {
        return timeFrameTransactions;
      }

      return timeFrameTransactions.filter(
        (transaction) => {
          if (
            filter === "month" ||
            filter === "year"
          ) {
            const transDate =
              new Date(
                transaction.date
              );

            if (
              filter === "month"
            ) {
              return (
                transDate.getMonth() ===
                  timeFrameRange.start.getMonth() &&
                transDate.getFullYear() ===
                  timeFrameRange.start.getFullYear()
              );
            }

            if (
              filter === "year"
            ) {
              return (
                transDate.getFullYear() ===
                timeFrameRange.start.getFullYear()
              );
            }
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
      timeFrameRange,
    ]);


  // ====================================================
  // CHART DATA
  // ====================================================

  const chartData = useMemo(() => {
    const data =
      chartPoints.map(
        (point) => ({
          ...point,
          income: 0,
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
                item.date?.getMonth() ===
                transDate.getMonth()
              );
            }

            return (
              item.date?.getDate() ===
                transDate.getDate() &&
              item.date?.getMonth() ===
                transDate.getMonth()
            );
          });

        if (point) {
          point.income += Math.round(
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
  // FETCH OVERVIEW
  // ====================================================

  const fetchOverview =
    useCallback(
      async (
        range = timeFrame ||
          "monthly"
      ) => {
        const headers =
          getAuthHeaders();

        if (!headers) {
          handleUnauthorized();
          return;
        }

        try {
          const response =
            await axios.get(
              `${API_BASE}/income/overview`,
              {
                headers,
                params: {
                  range,
                },
              }
            );

          console.log(
            "INCOME OVERVIEW:",
            response.data
          );

          if (
            response.data?.success
          ) {
            const payload =
              response.data.data ||
              {};

            setOverview({
              totalIncome:
                payload.totalIncome ??
                0,

              averageIncome:
                payload.averageIncome ??
                0,

              numberOfTransactions:
                payload.numberOfTransactions ??
                0,

              recentTransactions:
                payload.recentTransactions ??
                [],

              range:
                payload.range ??
                range,
            });
          }
        } catch (error) {
          console.error(
            "Overview Error:",
            error?.response
              ?.data || error
          );

          if (
            error?.response
              ?.status === 401
          ) {
            handleUnauthorized();
          }
        }
      },
      [
        timeFrame,
        getAuthHeaders,
        handleUnauthorized,
      ]
    );


  // ====================================================
  // FETCH OVERVIEW ON LOAD
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
  // TOTAL INCOME
  // ====================================================

  const calculatedTotalIncome =
    useMemo(() => {
      return filteredTransactions.reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );
    }, [filteredTransactions]);


  const totalIncome = useMemo(() => {
    if (
      overview.totalIncome !==
      undefined &&
      overview.totalIncome !== null
    ) {
      return Number(
        overview.totalIncome
      );
    }

    return calculatedTotalIncome;
  }, [
    overview.totalIncome,
    calculatedTotalIncome,
  ]);


  // ====================================================
  // AVERAGE
  // ====================================================

  const calculatedAverage =
    useMemo(() => {
      if (
        filteredTransactions.length ===
        0
      ) {
        return 0;
      }

      const total =
        filteredTransactions.reduce(
          (sum, transaction) =>
            sum +
            Number(
              transaction.amount ||
                0
            ),
          0
        );

      return (
        total /
        filteredTransactions.length
      );
    }, [filteredTransactions]);


  const averageIncome = useMemo(() => {
    if (
      overview.averageIncome !==
        undefined &&
      overview.averageIncome !== null &&
      Number(overview.averageIncome) >
        0
    ) {
      return Number(
        overview.averageIncome
      );
    }

    return calculatedAverage;
  }, [
    overview.averageIncome,
    calculatedAverage,
  ]);


  // ====================================================
  // TRANSACTION COUNT
  // ====================================================

  const transactionsCount =
    useMemo(() => {
      if (
        overview.numberOfTransactions !==
          undefined &&
        overview.numberOfTransactions !==
          null &&
        Number(
          overview.numberOfTransactions
        ) > 0
      ) {
        return Number(
          overview.numberOfTransactions
        );
      }

      return filteredTransactions.length;
    }, [
      overview.numberOfTransactions,
      filteredTransactions,
    ]);


  // ====================================================
  // ADD INCOME
  // ====================================================

  const handleAddTransaction =
    useCallback(async () => {
      if (
        !newTransaction.description?.trim()
      ) {
        alert(
          "Please enter description"
        );
        return;
      }

      if (
        !newTransaction.amount ||
        Number(newTransaction.amount) <=
          0
      ) {
        alert(
          "Please enter a valid amount"
        );
        return;
      }

      const headers =
        getAuthHeaders();

      if (!headers) {
        alert(
          "Your session has expired. Please login again."
        );

        handleUnauthorized();
        return;
      }

      try {
        setLoading(true);

        const payload = {
          description:
            newTransaction.description.trim(),

          amount: Number(
            newTransaction.amount
          ),

          category:
            newTransaction.category,

          date: toIsoWithClientTime(
            newTransaction.date
          ),
        };

        console.log(
          "========== ADD INCOME =========="
        );

        console.log(
          "URL:",
          `${API_BASE}/income/add`
        );

        console.log(
          "PAYLOAD:",
          payload
        );

        console.log(
          "AUTH:",
          headers
        );

        const response =
          await axios.post(
            `${API_BASE}/income/add`,
            payload,
            {
              headers: {
                "Content-Type":
                  "application/json",

                ...headers,
              },
            }
          );

        console.log(
          "ADD INCOME RESPONSE:",
          response.data
        );

        // Refresh main transactions
        if (
          typeof refreshTransactions ===
          "function"
        ) {
          await refreshTransactions();
        }

        // Refresh overview
        await fetchOverview(
          timeFrame || "monthly"
        );

        // Reset form
        setNewTransaction({
          date: new Date()
            .toISOString()
            .split("T")[0],

          description: "",

          amount: "",

          type: "income",

          category: "Salary",
        });

        setShowModal(false);

        alert(
          "Income added successfully!"
        );
      } catch (error) {
        console.error(
          "ADD INCOME ERROR:",
          error
        );

        console.error(
          "STATUS:",
          error?.response?.status
        );

        console.error(
          "DATA:",
          error?.response?.data
        );

        if (
          error?.response?.status ===
          401
        ) {
          handleUnauthorized();
          return;
        }

        alert(
          error?.response?.data
            ?.message ||
            "Failed to add income"
        );
      } finally {
        setLoading(false);
      }
    }, [
      newTransaction,
      getAuthHeaders,
      handleUnauthorized,
      refreshTransactions,
      fetchOverview,
      timeFrame,
    ]);


  // ====================================================
  // EDIT INCOME
  // ====================================================

  const handleEditTransaction =
    useCallback(async () => {
      if (!editingId) {
        return;
      }

      if (
        !editForm.description?.trim()
      ) {
        alert(
          "Please enter description"
        );
        return;
      }

      if (
        !editForm.amount ||
        Number(editForm.amount) <= 0
      ) {
        alert(
          "Please enter a valid amount"
        );
        return;
      }

      const headers =
        getAuthHeaders();

      if (!headers) {
        handleUnauthorized();
        return;
      }

      try {
        setLoading(true);

        const payload = {
          description:
            editForm.description.trim(),

          amount: Number(
            editForm.amount
          ),

          category:
            editForm.category,

          date: toIsoWithClientTime(
            editForm.date
          ),
        };

        console.log(
          "UPDATE INCOME:",
          payload
        );

        await axios.put(
          `${API_BASE}/income/update/${editingId}`,
          payload,
          {
            headers: {
              "Content-Type":
                "application/json",

              ...headers,
            },
          }
        );

        if (
          typeof refreshTransactions ===
          "function"
        ) {
          await refreshTransactions();
        }

        await fetchOverview(
          timeFrame || "monthly"
        );

        setEditingId(null);
      } catch (error) {
        console.error(
          "UPDATE INCOME ERROR:",
          error?.response
            ?.data || error
        );

        if (
          error?.response?.status ===
          401
        ) {
          handleUnauthorized();
          return;
        }

        alert(
          error?.response?.data
            ?.message ||
            "Failed to update income"
        );
      } finally {
        setLoading(false);
      }
    }, [
      editingId,
      editForm,
      getAuthHeaders,
      handleUnauthorized,
      refreshTransactions,
      fetchOverview,
      timeFrame,
    ]);


  // ====================================================
  // DELETE INCOME
  // ====================================================

  const handleDeleteTransaction =
    useCallback(
      async (id) => {
        if (!id) {
          return;
        }

        const confirmed =
          window.confirm(
            "Are you sure you want to delete this income?"
          );

        if (!confirmed) {
          return;
        }

        const headers =
          getAuthHeaders();

        if (!headers) {
          handleUnauthorized();
          return;
        }

        try {
          setLoading(true);

          console.log(
            "DELETE INCOME:",
            id
          );

          await axios.delete(
            `${API_BASE}/income/delete/${id}`,
            {
              headers,
            }
          );

          if (
            typeof refreshTransactions ===
            "function"
          ) {
            await refreshTransactions();
          }

          await fetchOverview(
            timeFrame || "monthly"
          );
        } catch (error) {
          console.error(
            "DELETE INCOME ERROR:",
            error?.response
              ?.data || error
          );

          if (
            error?.response?.status ===
            401
          ) {
            handleUnauthorized();
            return;
          }

          alert(
            error?.response?.data
              ?.message ||
              "Failed to delete income"
          );
        } finally {
          setLoading(false);
        }
      },
      [
        getAuthHeaders,
        handleUnauthorized,
        refreshTransactions,
        fetchOverview,
        timeFrame,
      ]
    );


  // ====================================================
  // EXPORT
  // ====================================================

  const handleExport =
    useCallback(async () => {
      const headers =
        getAuthHeaders();

      if (!headers) {
        handleUnauthorized();
        return;
      }

      try {
        const response =
          await axios.get(
            `${API_BASE}/income/downloadexcel`,
            {
              headers,

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

        const disposition =
          response.headers[
            "content-disposition"
          ];

        let filename =
          "income_details.xlsx";

        if (disposition) {
          const match =
            disposition.match(
              /filename="?([^"]+)"?/
            );

          if (
            match &&
            match[1]
          ) {
            filename =
              match[1];
          }
        }

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
          filename;

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

        if (
          error?.response?.status ===
          401
        ) {
          handleUnauthorized();
          return;
        }

        // Fallback
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

                Type: "Income",
              })
            );

          exportToExcel(
            exportData,
            `income_${new Date()
              .toISOString()
              .slice(0, 10)}`
          );
        } catch (fallbackError) {
          console.error(
            "Fallback export failed:",
            fallbackError
          );

          alert(
            "Failed to export data."
          );
        }
      }
    }, [
      getAuthHeaders,
      handleUnauthorized,
      filteredTransactions,
    ]);


  // ====================================================
  // RETURN
  // ====================================================

  return (
    <div className={styles.wrapper}>

      {/* HEADER */}

      <div
        className={
          styles.headerContainer
        }
      >
        <div className={styles.header}>

          <div>
            <h1
              className={
                styles.headerTitle
              }
            >
              Income Overview
            </h1>

            <p
              className={
                styles.headerSubtitle
              }
            >
              Track and manage your income
              sources
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
            <Plus
              size={18}
              className="md:size-5"
            />

            {loading
              ? "Processing..."
              : "Add Income"}
          </button>

        </div>

        <div
          className={
            styles.timeFrameContainer
          }
        >
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={
              setTimeFrame
            }
            options={[
              "daily",
              "weekly",
              "monthly",
              "yearly",
            ]}
            color="teal"
          />
        </div>
      </div>


      {/* SUMMARY */}

      <div className={styles.summaryGrid}>

        <FinancialCard
          icon={
            <div
              className={
                styles.iconGreen
              }
            >
              <DollarSign
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textGreen}`}
              />
            </div>
          }
          label="Total Income"
          value={`$${Number(
            totalIncome || 0
          ).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />

              {timeFrameRange.label}
            </div>
          }
        />


        <FinancialCard
          icon={
            <div
              className={
                styles.iconBlue
              }
            >
              <BarChart2
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textBlue}`}
              />
            </div>
          }
          label="Average Income"
          value={`$${Number(
            averageIncome || 0
          ).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />

              {transactionsCount}{" "}
              transactions
            </div>
          }
        />


        <FinancialCard
          icon={
            <div
              className={
                styles.iconPurple
              }
            >
              <TrendingUp
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textPurple}`}
              />
            </div>
          }
          label="Transactions"
          value={
            transactionsCount
          }
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />

              {filter === "all"
                ? "All records"
                : "Filtered records"}
            </div>
          }
        />

      </div>


      {/* CHART */}

      <IncomeChart
        chartData={chartData}
        timeFrame={timeFrame}
        timeFrameRange={
          timeFrameRange
        }
      />


      {/* TRANSACTIONS */}

      <div
        className={
          styles.listContainer
        }
      >

        <div className={styles.header}>

          <h3
            className={
              styles.sectionTitle
            }
          >
            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-500" />

            Income Transactions

            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>


          <FilterSection
            filter={filter}
            setFilter={setFilter}
            handleExport={
              handleExport
            }
          />

        </div>


        <div
          className={
            styles.transactionList
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
                <TransictionItem
                  key={
                    transaction.id ||
                    transaction._id
                  }

                  transaction={
                    transaction
                  }

                  isEditing={
                    editingId ===
                    (transaction.id ||
                      transaction._id)
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
                    setEditingId(null)
                  }

                  onDelete={
                    handleDeleteTransaction
                  }

                  type="income"

                  categoryIcons={
                    CATEGORY_ICONS_Inc
                  }

                  setEditingId={
                    setEditingId
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
                styles.emptyStateContainer
              }
            >
              <div
                className={
                  styles.emptyStateIcon
                }
              >
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>

              <p
                className={
                  styles.emptyStateText
                }
              >
                No income transactions
                found
              </p>

              <p
                className={
                  styles.emptyStateSubtext
                }
              >
                {filter === "all"
                  ? "You haven't recorded any income yet"
                  : `No ${filter} transactions found`}
              </p>

              <button
                onClick={() =>
                  setShowModal(true)
                }
                className={
                  styles.emptyStateButton
                }
              >
                <Plus
                  size={16}
                  className="md:size-5"
                />

                Add Income
              </button>
            </div>
          )}

        </div>
      </div>


      {/* ADD INCOME MODAL */}

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
        type="income"
        title="Add New Income"
        buttonText="Add Income"
        categories={[
          "Salary",
          "Freelance",
          "Investment",
          "Bonus",
          "Other",
        ]}
        color="teal"
      />

    </div>
  );
};

export default Income;