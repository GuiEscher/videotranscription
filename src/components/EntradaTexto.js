import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../App.css'; 
const EntradaTexto = ({
  label,
  value,
  onChange,
  secureTextEntry,
  type,
  error,
  messageError,
  style
}) => {
  const [secureMode, setSecureMode] = useState(secureTextEntry);

  return (
    <div className={`input-container ${error ? 'input-error' : ''}`} style={style}>
      {label && <label className="input-label">{label}</label>}
      <input
        type={secureMode ? 'password' : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`custom-input ${error ? 'input-error' : ''}`}
        placeholder={label}
      />
      {secureTextEntry && (
        <button
          type="button"
          className="visibility-toggle-button"
          onClick={() => setSecureMode(!secureMode)}
        >
          {secureMode ? 'Mostrar' : 'Ocultar'}
        </button>
      )}
      {error && <span className="error-message">{messageError}</span>}
    </div>
  );
};

EntradaTexto.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  secureTextEntry: PropTypes.bool,
  type: PropTypes.string,
  error: PropTypes.bool,
  messageError: PropTypes.string,
  style: PropTypes.object,
};

EntradaTexto.defaultProps = {
  label: '',
  secureTextEntry: false,
  type: 'text',
  error: false,
  messageError: '',
  style: {},
};

export default EntradaTexto;
