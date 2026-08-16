import React from "react";
import { X } from "lucide-react";
import { modalStyles } from "../assets/dummyStyles";

const AddTransactionModal = ({
  showModal,
  setShowModal,
  newTransaction,
  setNewTransaction,
  handleAddTransaction,
  type = "both",
  title = "Add New Transaction",
  buttonText = "Add Transaction",

  categories = [
    "Food",
    "Housing",
    "Transport",
    "Shopping",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Salary",
    "Freelance",
    "Investments",
    "Bonus",
    "Other",
  ],

  color = "teal",
}) => {
  // Modal closed
  if (!showModal) return null;

  // Current date
  const today = new Date();
  const currentYear = today.getFullYear();

  const currentDate = today
    .toISOString()
    .split("T")[0];

  const minDate = `${currentYear}-01-01`;

  const colorClass =
    modalStyles.colorClasses[color];

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.modalContainer}>

        {/* ================= HEADER ================= */}
        <div className={modalStyles.modalHeader}>

          <h3 className={modalStyles.modalTitle}>
            {title}
          </h3>

          <button
            type="button"
            onClick={() => setShowModal(false)}
            className={modalStyles.closeButton}
          >
            <X size={24} />
          </button>

        </div>

        {/* ================= FORM ================= */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddTransaction();
          }}
        >

          <div className={modalStyles.form}>

            {/* ================= DESCRIPTION ================= */}
            <div>
              <label className={modalStyles.label}>
                Description
              </label>

              <input
                type="text"
                value={
                  newTransaction.description || ""
                }
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    description:
                      e.target.value,
                  }))
                }
                className={modalStyles.input(
                  colorClass.ring
                )}
                placeholder={
                  type === "both"
                    ? "Salary, funds, etc."
                    : "Groceries, rent, etc."
                }
                required
              />
            </div>

            {/* ================= AMOUNT ================= */}
            <div>
              <label className={modalStyles.label}>
                Amount
              </label>

              <input
                type="number"
                value={
                  newTransaction.amount || ""
                }
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    amount:
                      e.target.value,
                  }))
                }
                className={modalStyles.input(
                  colorClass.ring
                )}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* ================= TYPE ================= */}
            {type === "both" && (
              <div>

                <label className={modalStyles.label}>
                  Type
                </label>

                <div
                  className={
                    modalStyles.typeButtonContainer
                  }
                >

                  {/* Income */}
                  <button
                    type="button"
                    className={modalStyles.typeButton(
                      newTransaction.type ===
                        "income",
                      modalStyles.colorClasses
                        .teal
                        .typeButtonSelected
                    )}
                    onClick={() =>
                      setNewTransaction(
                        (prev) => ({
                          ...prev,
                          type: "income",
                        })
                      )
                    }
                  >
                    Income
                  </button>

                  {/* Expense */}
                  <button
                    type="button"
                    className={modalStyles.typeButton(
                      newTransaction.type ===
                        "expense",
                      modalStyles.colorClasses
                        .orange
                        .typeButtonSelected
                    )}
                    onClick={() =>
                      setNewTransaction(
                        (prev) => ({
                          ...prev,
                          type: "expense",
                        })
                      )
                    }
                  >
                    Expense
                  </button>

                </div>
              </div>
            )}

            {/* ================= CATEGORY ================= */}
            <div>

              <label className={modalStyles.label}>
                Category
              </label>

              <select
                value={
                  newTransaction.category || ""
                }
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    category:
                      e.target.value,
                  }))
                }
                className={modalStyles.input(
                  colorClass.ring
                )}
                required
              >

                <option
                  value=""
                  disabled
                >
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* ================= DATE ================= */}
            <div>

              <label className={modalStyles.label}>
                Date
              </label>

              <input
                type="date"
                value={
                  newTransaction.date ||
                  currentDate
                }
                min={minDate}
                max={currentDate}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    date:
                      e.target.value,
                  }))
                }
                className={modalStyles.input(
                  colorClass.ring
                )}
                required
              />

            </div>

            {/* ================= SUBMIT ================= */}
            <button
              type="submit"
              disabled={
                !newTransaction.description ||
                !newTransaction.amount ||
                !newTransaction.category ||
                !newTransaction.date
              }
              className={`
                ${modalStyles.submitButton(
                  colorClass.button
                )}
                disabled:opacity-50
                disabled:cursor-not-allowed
              `}
            >
              {buttonText}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddTransactionModal;