import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = (s) => {
    switch (s?.toUpperCase()) {
      case 'COMPLETED':
      case 'RESOLVED':
      case 'CLOSED':
      case 'PASSED':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
      case 'SCHEDULED':
      case 'ASSIGNED':
      case 'TESTING':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30';
      case 'PLANNED':
      case 'HANDOVER_PENDING':
      case 'WAITING_PARTS':
      case 'WAITING_APPROVAL':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
      case 'BLOCKED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-950/60 text-rose-400 border-rose-500/30';
      case 'DRAFT':
      case 'OPEN':
      case 'SURVEY_DUE':
      case 'SURVEY_PENDING':
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStyle(status)}`}>
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
};

export const CyberCard = ({ children, className = '' }) => (
  <div className={`bg-[#10182f] border border-[#1e2a4a] rounded-lg shadow-lg p-5 text-slate-200 ${className}`}>
    {children}
  </div>
);

export const CyberButton = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  let variantStyle = 'bg-cyan-500 hover:bg-cyan-400 text-[#070e1e] font-semibold';
  if (variant === 'secondary') {
    variantStyle = 'bg-[#0a1020] border border-[#1e2a4a] text-slate-300 hover:bg-[#152342] hover:text-white';
  } else if (variant === 'danger') {
    variantStyle = 'bg-rose-600 hover:bg-rose-500 text-white font-medium';
  } else if (variant === 'success') {
    variantStyle = 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium';
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyle} ${className}`}
    >
      {children}
    </button>
  );
};

export const CyberInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error = '',
  className = '',
  disabled = false,
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-xs font-medium text-slate-400">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
    )}
    <input
      type={type}
      disabled={disabled}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="bg-[#0a1020] border border-[#1e2a4a] rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50"
    />
    {error && <span className="text-xs text-rose-400">{error}</span>}
  </div>
);

export const CyberSelect = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error = '',
  className = '',
  disabled = false,
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-xs font-medium text-slate-400">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
    )}
    <select
      disabled={disabled}
      value={value}
      onChange={onChange}
      required={required}
      className="bg-[#0a1020] border border-[#1e2a4a] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0a1020] text-slate-200">
          {opt.label}
        </option>
      ))}
    </select>
    {error && <span className="text-xs text-rose-400">{error}</span>}
  </div>
);
