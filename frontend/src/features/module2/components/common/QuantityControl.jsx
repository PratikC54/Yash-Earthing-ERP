import React from 'react';
import { Plus, Minus } from 'lucide-react';

/**
 * Reusable Quantity Input with bounded increment and decrement controls
 * Prevents negative or zero values. Minimum is strictly 1.
 */
export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
  className = "",
  disabled = false,
}) {
  const currentVal = Math.max(min, Number(value) || min);

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const newVal = Math.max(min, currentVal - step);
    onChange(newVal);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const newVal = Math.min(max, currentVal + step);
    onChange(newVal);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(min);
      return;
    }
    const parsed = Math.max(min, Math.min(max, parseInt(raw, 10) || min));
    onChange(parsed);
  };

  return (
    <div className={`inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || currentVal <= min}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3 h-3 stroke-[2.5]" />
      </button>

      <input
        type="number"
        value={currentVal}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="w-14 text-center font-bold text-slate-800 text-xs py-1 border-x border-slate-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || currentVal >= max}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        aria-label="Increase quantity"
      >
        <Plus className="w-3 h-3 stroke-[2.5]" />
      </button>
    </div>
  );
}
