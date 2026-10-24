import React, { useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import Modal from "./Modal";
import { productionService } from "../../features/production_quality/services/productionService";

const ADD_CUSTOM_KEY = "__ADD_CUSTOM_VALUE__";

export default function CustomDropdown({
  label,
  value,
  onChange,
  options = [],
  category,
  placeholder = "Select an option...",
  disabled = false,
  required = false,
  error = "",
  className = "",
  modalTitle,
  categoryLabel,
  onOptionAdded,
}) {
  const [internalOptions, setInternalOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync incoming options to local state
  useEffect(() => {
    if (Array.isArray(options) && options.length > 0) {
      const normalized = options.map((opt) => {
        if (typeof opt === "string") {
          return { value: opt, label: opt, isCustom: false };
        }
        return {
          value: opt.value ?? opt.label,
          label: opt.label ?? opt.value,
          isCustom: Boolean(opt.isCustom),
        };
      });
      setInternalOptions(normalized);
    }
  }, [options]);

  // If no options passed but category provided, optionally fetch options from API
  useEffect(() => {
    if ((!options || options.length === 0) && category) {
      let isMounted = true;
      productionService
        .getDropdownOptions(category)
        .then((res) => {
          if (isMounted) {
            const data = res?.data?.data || res?.data || [];
            const normalized = data.map((opt) => {
              if (typeof opt === "string") {
                return { value: opt, label: opt, isCustom: false };
              }
              return {
                value: opt.value ?? opt.label,
                label: opt.label ?? opt.value,
                isCustom: Boolean(opt.isCustom),
              };
            });
            setInternalOptions(normalized);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch master dropdown options:", err);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [category, options]);

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === ADD_CUSTOM_KEY) {
      // Open modal, do not overwrite the current value yet
      setNewValue("");
      setNewDescription("");
      setModalError("");
      setIsModalOpen(true);
      return;
    }
    onChange?.(selected);
  };

  const handleSaveCustom = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newValue.trim();

    if (!trimmed) {
      setModalError("Please enter a value.");
      return;
    }

    if (trimmed.length < 2) {
      setModalError("Custom value must be at least 2 characters long.");
      return;
    }

    if (trimmed.length > 120) {
      setModalError("Custom value cannot exceed 120 characters.");
      return;
    }

    // Check duplicate in internalOptions
    const duplicate = internalOptions.find(
      (opt) => (opt.value || opt.label || "").toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setModalError("This value already exists.");
      return;
    }

    setIsSubmitting(true);
    setModalError("");

    try {
      let createdOption = { value: trimmed, label: trimmed, isCustom: true };

      if (category) {
        const response = await productionService.createDropdownOption({
          category,
          value: trimmed,
          label: trimmed,
          description: newDescription.trim() || undefined,
        });
        const serverData = response?.data?.data || response?.data;
        if (serverData) {
          createdOption = {
            id: serverData.id,
            value: serverData.value || trimmed,
            label: serverData.label || trimmed,
            isCustom: true,
          };
        }
      }

      // Add to internal list
      setInternalOptions((prev) => [...prev, createdOption]);

      // Automatically select the newly created value
      onChange?.(createdOption.value);
      onOptionAdded?.(createdOption);

      setIsModalOpen(false);
      setNewValue("");
      setNewDescription("");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to save custom value.";
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCategory =
    categoryLabel ||
    (category
      ? category.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
      : "Option");

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <select
        value={value || ""}
        onChange={handleSelectChange}
        disabled={disabled}
        className={`w-full bg-[#10182f] border ${
          error ? "border-rose-500/80" : "border-[#1e2a4a]"
        } rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {internalOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {opt.isCustom ? "★ (Custom)" : ""}
          </option>
        ))}
        <option
          value={ADD_CUSTOM_KEY}
          className="text-amber-400 bg-[#0d1527] font-semibold py-1"
        >
          ➕ + Add Custom Value
        </option>
      </select>

      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}

      {/* Add Custom Value Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsModalOpen(false);
        }}
        title={modalTitle || `Add Custom ${displayCategory}`}
        subtitle={`Add a new ${displayCategory.toLowerCase()} to the system. It will immediately be available in this dropdown.`}
      >
        <form onSubmit={handleSaveCustom} className="space-y-4 pt-1">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
              New Value <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Enter new ${displayCategory.toLowerCase()}...`}
              disabled={isSubmitting}
              className="w-full bg-[#0b1329] border border-[#1e2a4a] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition"
            />
            <p className="text-[11px] text-[#64748b] mt-1">
              Length between 2 and 120 characters. Must be unique.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Provide additional details or context for this custom value..."
              disabled={isSubmitting}
              className="w-full bg-[#0b1329] border border-[#1e2a4a] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2a4a]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-slate-800/50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newValue.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  Save Value
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
