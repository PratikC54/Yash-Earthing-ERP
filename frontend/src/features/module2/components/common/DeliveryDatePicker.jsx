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
        <label htmlFor={name} className="block text-slate-700 font-semibold text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
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
          className={`w-full bg-[#f8fafc] border text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 ${
            error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200'
          }`}
        />
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
