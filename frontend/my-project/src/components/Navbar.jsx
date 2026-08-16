import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";
import axios from "axios";

import { navbarStyles } from "../assets/dummyStyles";
import img1 from "../assets/logo.png";

const BASE_URL = "http://localhost:1234/api";

const Navbar = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(
    propUser || {
      name: "",
      email: "",
    }
  );

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await axios.get(`${BASE_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data.user || response.data;

        setUser(userData);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    if (propUser) {
      setUser(propUser);
    } else {
      fetchUserData();
    }
  }, [propUser]);

  // Toggle dropdown
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Logout
  const handleLogout = () => {
    setMenuOpen(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (typeof onLogout === "function") {
    onLogout();
  }

    navigate("/login");
  };
  //close of here
   useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={navbarStyles.header}>
      <div className={navbarStyles.container}>

        {/* Logo */}
        <div
          className={navbarStyles.logoContainer}
          onClick={() => navigate("/")}
        >
          <div className={navbarStyles.logoImage}>
            <img src={img1} alt="ExpenseFlow Logo" />
          </div>

          <span className={navbarStyles.logoText}>
            ExpenseFlow
          </span>
        </div>

        {/* User Section */}
        {user && (
          <div
            className={navbarStyles.userContainer}
            ref={menuRef}
          >
            {/* User Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className={navbarStyles.userButton}
            >
              {/* Avatar */}
              <div className="relative">
                <div className={navbarStyles.userAvatar}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>

                <div className={navbarStyles.statusIndicator}></div>
              </div>

              {/* User Details */}
              <div className={navbarStyles.userTextContainer}>
                <p className={navbarStyles.userName}>
                  {user?.name || "User"}
                </p>

                <p className={navbarStyles.userEmail}>
                  {user?.email || "user@expensetracker.com"}
                </p>
              </div>

              {/* Arrow */}
              <ChevronDown
                className={navbarStyles.chevronIcon(menuOpen)}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className={navbarStyles.dropdownMenu}>

                {/* Dropdown Header */}
                <div className={navbarStyles.dropdownHeader}>
                  <div className="flex items-center gap-3">

                    <div className={navbarStyles.dropdownAvatar}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <div className={navbarStyles.dropdownName}>
                        {user?.name || "User"}
                      </div>

                      <div className={navbarStyles.dropdownEmail}>
                        {user?.email || "user@expensetracker.com"}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Profile */}
                <div className={navbarStyles.menuItemContainer}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                    className={navbarStyles.menuItem}
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                </div>

                {/* Logout */}
                <div className={navbarStyles.menuItemBorder}>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={navbarStyles.logoutButton}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;