import React from 'react';
import { usePhoneNumber } from '../utils/phoneNumberUtils';

const PhoneNumberInput = ({ 
  value = '',
  onChange,
  id = 'phone',
  label = '전화번호',
  placeholder = '010-0000-0000',
  required = false,
  disabled = false,
  className = '',
  showHelper = true,
  ...props 
}) => {
  const { 
    phoneFormatted, 
    phoneError, 
    handlePhoneChange 
  } = usePhoneNumber(value, onChange);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id}>
          <strong>{label}</strong>
          {required && <span style={{ color: 'red' }}> *</span>}
        </label>
      )}
      <input 
        type="tel" 
        id={id}
        value={phoneFormatted}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${phoneError ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {phoneError ? (
        <p className="error-message">{phoneError}</p>
      ) : (
        showHelper && <p className="helper-text">형식: 010-0000-0000</p>
      )}
    </div>
  );
};

export default PhoneNumberInput; 