import React from "react";
import PropTypes from "prop-types";

const SettingsField = ({ labelName, inputId, className, children }) => {
  let formattedClassName = "";
  if (className) {
    formattedClassName = ` ${className}`;
  }

  return (
    <div className={`settings-field${formattedClassName}`}>
      <label className={`label`} htmlFor={`${inputId}`}>
        {labelName}
      </label>
      <div className="settings-input-group">{children}</div>
    </div>
  );
};

SettingsField.propTypes = {
  labelName: PropTypes.string,
  inputId: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default SettingsField;
