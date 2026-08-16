import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import axios from "axios";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Expense from "./pages/Expense";
import Income from "./pages/Income";
import Profile from "./pages/Profile";

const API_URL = "http://localhost:1234/api";

// ======================================================
// STORAGE HELPERS
// ======================================================

const getStoredToken = () => {
  return (
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    null
  );
};

const getStoredUser = () => {
  try {
    const localUser = localStorage.getItem("user");

    if (localUser) {
      return JSON.parse(localUser);
    }

    const sessionUser =
      sessionStorage.getItem("user");

    if (sessionUser) {
      return JSON.parse(sessionUser);
    }

    return null;
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    return null;
  }
};

// ======================================================
// SCROLL TOP
// ======================================================

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

// ======================================================
// PROTECTED ROUTE
// ======================================================

function ProtectedRoute({
  user,
  token,
  children,
}) {
  if (!user || !token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ======================================================
// APP
// ======================================================

function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [timeFrame, setTimeFrame] =
    useState("monthly");

  // ====================================================
  // SAVE AUTH
  // ====================================================

  const persistAuth = useCallback(
    (
      userData,
      tokenData,
      remember = false
    ) => {
      if (!userData || !tokenData) {
        console.error(
          "Cannot save authentication"
        );
        return false;
      }

      console.log(
        "========== SAVING AUTH =========="
      );

      // Clear previous auth
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Choose storage
      const storage = remember
        ? localStorage
        : sessionStorage;

      // Save token
      storage.setItem(
        "token",
        tokenData
      );

      // Save user
      storage.setItem(
        "user",
        JSON.stringify(userData)
      );

      // Update React state immediately
      setToken(tokenData);
      setUser(userData);

      console.log(
        "AUTH SAVED:",
        remember
          ? "localStorage"
          : "sessionStorage"
      );

      console.log(
        "TOKEN:",
        storage.getItem("token")
          ? "FOUND"
          : "NOT FOUND"
      );

      console.log(
        "USER:",
        storage.getItem("user")
      );

      return true;
    },
    []
  );

  // ====================================================
  // CLEAR AUTH
  // ====================================================

  const clearAuth = useCallback(() => {
    console.log(
      "========== CLEARING AUTH =========="
    );

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setTransactions([]);
  }, []);

  // ====================================================
  // LOAD AUTH ON APP START
  // ====================================================

  useEffect(() => {
    let mounted = true;

    const loadAuth = async () => {
      try {
        console.log(
          "========== LOADING AUTH =========="
        );

        const storedToken =
          getStoredToken();

        const storedUser =
          getStoredUser();

        console.log(
          "STORED TOKEN:",
          storedToken
            ? "FOUND"
            : "NOT FOUND"
        );

        console.log(
          "STORED USER:",
          storedUser
        );

        // ----------------------------------------------
        // NOTHING STORED
        // ----------------------------------------------

        if (!storedToken) {
          console.log(
            "No stored authentication found"
          );

          if (mounted) {
            setUser(null);
            setToken(null);
          }

          return;
        }

        // ----------------------------------------------
        // TOKEN + USER AVAILABLE
        // ----------------------------------------------

        if (
          storedToken &&
          storedUser
        ) {
          console.log(
            "Stored authentication restored"
          );

          if (mounted) {
            setToken(storedToken);
            setUser(storedUser);
          }

          return;
        }

        // ----------------------------------------------
        // TOKEN AVAILABLE BUT USER MISSING
        // ----------------------------------------------

        console.log(
          "Token found but user missing."
        );

        const response =
          await axios.get(
            `${API_URL}/auth/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${storedToken}`,
              },
            }
          );

        const profile =
          response.data?.user;

        if (!profile) {
          throw new Error(
            "User profile not found"
          );
        }

        const remember =
          Boolean(
            localStorage.getItem(
              "token"
            )
          );

        if (mounted) {
          persistAuth(
            profile,
            storedToken,
            remember
          );
        }
      } catch (error) {
        console.error(
          "AUTH RESTORE ERROR:",
          error?.response?.data ||
            error.message
        );

        clearAuth();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAuth();

    return () => {
      mounted = false;
    };
  }, [persistAuth, clearAuth]);

  // ====================================================
  // LOGIN
  // ====================================================

  const handleLogin = useCallback(
    (
      userData,
      remember = false,
      tokenData = null
    ) => {
      console.log(
        "========== HANDLE LOGIN =========="
      );

      console.log(
        "LOGIN USER:",
        userData
      );

      console.log(
        "LOGIN TOKEN:",
        tokenData
      );

      if (!userData || !tokenData) {
        console.error(
          "Login failed: user/token missing"
        );

        return false;
      }

      const saved =
        persistAuth(
          userData,
          tokenData,
          remember
        );

      if (!saved) {
        return false;
      }

      navigate("/dashboard", {
        replace: true,
      });

      return true;
    },
    [persistAuth, navigate]
  );

  // ====================================================
  // SIGNUP
  // ====================================================

  const handleSignup = useCallback(
    (
      userData,
      remember = false,
      tokenData = null
    ) => {
      console.log(
        "========== HANDLE SIGNUP =========="
      );

      console.log(
        "SIGNUP USER:",
        userData
      );

      console.log(
        "SIGNUP TOKEN:",
        tokenData
      );

      if (!userData || !tokenData) {
        console.error(
          "Signup failed: user/token missing"
        );

        return false;
      }

      const saved =
        persistAuth(
          userData,
          tokenData,
          remember
        );

      if (!saved) {
        return false;
      }

      navigate("/dashboard", {
        replace: true,
      });

      return true;
    },
    [persistAuth, navigate]
  );

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = useCallback(() => {
    clearAuth();

    navigate("/login", {
      replace: true,
    });
  }, [clearAuth, navigate]);

  // ====================================================
  // FETCH TRANSACTIONS
  // ====================================================

  const refreshTransactions =
    useCallback(async () => {
      const currentToken =
        getStoredToken();

      console.log(
        "Fetching transactions. Token:",
        currentToken
          ? "FOUND"
          : "NOT FOUND"
      );

      if (!currentToken) {
        setTransactions([]);
        return;
      }

      try {
        const headers = {
          Authorization:
            `Bearer ${currentToken}`,
        };

        console.log(
          "Fetching income and expense..."
        );

        const [
          incomeResponse,
          expenseResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/income/get`,
            { headers }
          ),

          axios.get(
            `${API_URL}/expense/get`,
            { headers }
          ),
        ]);

        console.log(
          "INCOME:",
          incomeResponse.data
        );

        console.log(
          "EXPENSE:",
          expenseResponse.data
        );

        const incomeData =
          incomeResponse.data?.data ||
          incomeResponse.data?.incomes ||
          [];

        const expenseData =
          expenseResponse.data?.data ||
          expenseResponse.data?.expenses ||
          [];

        const incomes =
          Array.isArray(incomeData)
            ? incomeData
            : [];

        const expenses =
          Array.isArray(expenseData)
            ? expenseData
            : [];

        // ----------------------------------------------
        // INCOME
        // ----------------------------------------------

        const normalizedIncome =
          incomes.map((item) => ({
            ...item,

            id:
              item._id ||
              item.id,

            type: "income",

            amount:
              Number(item.amount) || 0,

            date:
              item.date ||
              item.createdAt,

            description:
              item.description ||
              "Income",

            category:
              item.category ||
              "Salary",
          }));

        // ----------------------------------------------
        // EXPENSE
        // ----------------------------------------------

        const normalizedExpense =
          expenses.map((item) => ({
            ...item,

            id:
              item._id ||
              item.id,

            type: "expense",

            amount:
              Number(item.amount) || 0,

            date:
              item.date ||
              item.createdAt,

            description:
              item.description ||
              "Expense",

            category:
              item.category ||
              "Other",
          }));

        // ----------------------------------------------
        // COMBINE
        // ----------------------------------------------

        const allTransactions = [
          ...normalizedIncome,
          ...normalizedExpense,
        ].sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );

        setTransactions(
          allTransactions
        );

        console.log(
          "TRANSACTIONS:",
          allTransactions
        );
      } catch (error) {
        console.error(
          "TRANSACTION ERROR:",
          error?.response?.data ||
            error.message
        );

        if (
          error?.response?.status ===
          401
        ) {
          clearAuth();

          navigate("/login", {
            replace: true,
          });
        }
      }
    }, [clearAuth, navigate]);

  // ====================================================
  // FETCH TRANSACTIONS AFTER LOGIN
  // ====================================================

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    refreshTransactions();
  }, [
    user,
    token,
    refreshTransactions,
  ]);

  // ====================================================
  // TRANSACTION HELPERS
  // ====================================================

  const addTransaction =
    useCallback(
      (newTransaction) => {
        setTransactions(
          (prev) => [
            newTransaction,
            ...prev,
          ]
        );
      },
      []
    );

  const editTransaction =
    useCallback(
      (
        id,
        updatedTransaction
      ) => {
        setTransactions(
          (prev) =>
            prev.map(
              (transaction) =>
                transaction.id === id
                  ? {
                      ...updatedTransaction,
                      id,
                    }
                  : transaction
            )
        );
      },
      []
    );

  const deleteTransaction =
    useCallback(
      (id) => {
        setTransactions(
          (prev) =>
            prev.filter(
              (transaction) =>
                transaction.id !== id
            )
        );
      },
      []
    );

  // ====================================================
  // INITIAL LOADING
  // ====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-white/20 border-t-teal-400 animate-spin" />

          <p className="mt-4 text-white">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // ROUTES
  // ====================================================

  return (
    <>
      <ScrollToTop />

      <Routes>

        {/* LOGIN */}

        <Route
          path="/login"
          element={
            user && token ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Login
                onLogin={handleLogin}
                API_URL={API_URL}
              />
            )
          }
        />

        {/* SIGNUP */}

        <Route
          path="/signup"
          element={
            user && token ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Signup
                onSignup={handleSignup}
              />
            )
          }
        />

        {/* PROTECTED ROUTES */}

        <Route
          element={
            <ProtectedRoute
              user={user}
              token={token}
            >
              <Layout
                user={user}
                onLogout={handleLogout}
                transactions={transactions}
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
                timeFrame={timeFrame}
                setTimeFrame={
                  setTimeFrame
                }
              />
            </ProtectedRoute>
          }
        >

          {/* ROOT */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* DASHBOARD */}

          <Route
            path="/dashboard"
            element={
              <Dashboard
                transactions={
                  transactions
                }
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
                timeFrame={
                  timeFrame
                }
                setTimeFrame={
                  setTimeFrame
                }
              />
            }
          />

          {/* INCOME */}

          <Route
            path="/income"
            element={
              <Income
                transactions={
                  transactions
                }
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
                timeFrame={
                  timeFrame
                }
                setTimeFrame={
                  setTimeFrame
                }
              />
            }
          />

          {/* EXPENSE */}

          <Route
            path="/expense"
            element={
              <Expense
                transactions={
                  transactions
                }
                addTransaction={
                  addTransaction
                }
                editTransaction={
                  editTransaction
                }
                deleteTransaction={
                  deleteTransaction
                }
                refreshTransactions={
                  refreshTransactions
                }
                timeFrame={
                  timeFrame
                }
                setTimeFrame={
                  setTimeFrame
                }
              />
            }
          />

          {/* PROFILE */}

          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                onUpdateProfile={setUser}
                onLogout={handleLogout}
              />
            }
          />

        </Route>

        {/* UNKNOWN ROUTE */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                user && token
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />

      </Routes>
    </>
  );
}

export default App;