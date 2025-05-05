import React from 'react';
import { cn } from '../../utils/cn';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  disabled = false,
  className,
  options = [],
  ...props
}) => {
  const inputClasses = cn(
    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
    {
      'border-red-500': error && touched,
      'border-gray-300': !error || !touched,
      'bg-gray-100 cursor-not-allowed': disabled,
    },
    className
  );

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
            {...props}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClasses}
            rows={4}
            {...props}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            name={name}
            checked={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...props}
          />
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClasses}
            {...props}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && touched && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormField; 