import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * Reusable Delivery Date Picker component
 * Works on desktop and mobile with native calendar popup and accessible date styling
 */
export default function DeliveryDatePicker({
  label = "Required Delivery Date",
  name = "requiredBy",
  value,
  onChange,
  required = false,
  minDate = new Date().toISOString().split('T')[0],
  className = "",
  error,
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-slate-300 font-semibold text-xs">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          min={minDate}
          required={required}
          className={`w-full bg-[#0a1020] border text-slate-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'
          }`}
        />
      </div>
      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
}
