import React, { useState } from "react";
import {
  DollarSign,
  Save,
  X,
  Edit,
  Trash2,
} from "lucide-react";

import { transactionItemStyles } from "../assets/dummyStyles";
import { colorClasses } from "../assets/color";

const TransictionItem = ({
  transaction,
  isEditing,
  editForm,
  setEditForm,
  onSave,
  onCancel,
  onDelete,
  type = "expense",
  categoryIcons = {},
  setEditingId,
  amountClass = "font-bold truncate block text-right",
  iconClass = "p-3 rounded-xl flex-shrink-0",
}) => {
  const [errors, setErrors] = useState({
    description: "",
    amount: "",
  });

  const classes = colorClasses[type];
  const sign = type === "income" ? "+" : "-";

  // ==========================================
  // VALIDATION
  // ==========================================
  const validate = () => {
    const nextErrors = {
      description: "",
      amount: "",
    };

    const description = String(
      editForm?.description ?? ""
    ).trim();

    const amountRaw = editForm?.amount;

    const amount =
      amountRaw === "" ||
      amountRaw === null ||
      amountRaw === undefined
        ? ""
        : String(amountRaw).trim();

    if (!description) {
      nextErrors.description =
        "Description is required.";
    }

    if (amount === "") {
      nextErrors.amount =
        "Amount is required.";
    } else if (Number(amount) <= 0) {
      nextErrors.amount =
        "Amount must be greater than 0.";
    }

    setErrors(nextErrors);

    return (
      !nextErrors.description &&
      !nextErrors.amount
    );
  };

  // ==========================================
  // SAVE
  // ==========================================
  const handleSaveClick = () => {
    if (!validate()) {
      return;
    }

    setErrors({
      description: "",
      amount: "",
    });

    onSave();
  };

  // ==========================================
  // EDIT
  // ==========================================
  const handleEditClick = () => {
    setEditForm({
      description:

        transaction.description ?? "",


      amount:
      
        transaction.amount ?? "",

      category:
        transaction.category ?? "",

      date:
        transaction.date
          ? new Date(transaction.date)
              .toISOString()
              .split("T")[0]
          : "",

      type:
        transaction.type ?? type,
    });

    setErrors({
      description: "",
      amount: "",
    });

    setEditingId(
      transaction.id || transaction._id
    );
  };

  // ==========================================
  // CANCEL
  // ==========================================
  const handleCancelClick = () => {
    setErrors({
      description: "",
      amount: "",
    });

    onCancel();
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDeleteClick = () => {
    const id =
      transaction.id || transaction._id;

    if (!id) {
      console.error(
        "Transaction ID is missing:",
        transaction
      );
      return;
    }

    onDelete(id);
  };

  return (
    <div
      className={transactionItemStyles.container(
        isEditing,
        classes
      )}
    >
      {/* ======================================
          LEFT SIDE
      ======================================= */}
      <div
        className={
          transactionItemStyles.mainContainer
        }
      >
        {/* CATEGORY ICON */}
        <div
          className={transactionItemStyles.iconContainer(
            iconClass,
            classes
          )}
        >
          {categoryIcons[
            transaction.category
          ] || (
            <DollarSign className="w-5 h-5" />
          )}
        </div>

        {/* DETAILS */}
        <div
          className={
            transactionItemStyles.contentContainer
          }
        >
          {isEditing ? (
            <>
              <input
                type="text"
                value={
                  editForm?.description ?? ""
                }
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description:
                      e.target.value,
                  }))
                }
                className={transactionItemStyles.input(
                  !!errors.description,
                  classes
                )}
                placeholder="Description"
              />

              {errors.description && (
                <p
                  id={`des-error-${
                    transaction.id ||
                    transaction._id
                  }`}
                  className={
                    transactionItemStyles.errorText
                  }
                >
                  {errors.description}
                </p>
              )}
            </>
          ) : (
            <p
              className={
                transactionItemStyles.description
              }
            >
              {transaction.description ||
                "No description"}
            </p>
          )}

          {/* DATE + CATEGORY */}
          <p
            className={
              transactionItemStyles.details
            }
          >
            {transaction.date
              ? new Date(
                  transaction.date
                ).toLocaleDateString()
              : "No date"}

            {" • "}

            {transaction.category ||
              "Other"}
          </p>
        </div>
      </div>

      {/* ======================================
          RIGHT SIDE
      ======================================= */}
      <div
        className={
          transactionItemStyles.actionsContainer
        }
      >
        {/* AMOUNT */}
        <div
          className={
            transactionItemStyles.amountContainer
          }
        >
          {isEditing ? (
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  editForm?.amount ?? ""
                }
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    amount:
                      e.target.value,
                  }))
                }
                className={transactionItemStyles.amountInput(
                  !!errors.amount,
                  classes
                )}
                placeholder="Amount"
              />

              {errors.amount && (
                <p
                  id={`amt-error-${
                    transaction.id ||
                    transaction._id
                  }`}
                  className={
                    transactionItemStyles.errorText
                  }
                >
                  {errors.amount}
                </p>
              )}
            </>
          ) : (
            <span
              className={transactionItemStyles.amountText(
                amountClass,
                classes
              )}
            >
              {sign}₹
              {Number(
                transaction.amount || 0
              ).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </span>
          )}
        </div>

        {/* BUTTONS */}
        <div
          className={
            transactionItemStyles.buttonsContainer
          }
        >
          {isEditing ? (
            <>
              {/* SAVE */}
              <button
                type="button"
                onClick={handleSaveClick}
                className={transactionItemStyles.saveButton(
                  classes
                )}
                title="Save"
              >
                <Save size={16} />
              </button>

              {/* CANCEL */}
              <button
                type="button"
                onClick={handleCancelClick}
                className={
                  transactionItemStyles.cancelButton
                }
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              {/* EDIT */}
              <button
                type="button"
                onClick={handleEditClick}
                className={transactionItemStyles.editButton(
                  classes
                )}
                title="Edit"
              >
                <Edit size={16} />
              </button>

              {/* DELETE */}
              <button
                type="button"
                onClick={handleDeleteClick}
                className={transactionItemStyles.deleteButton(
                  classes
                )}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransictionItem;