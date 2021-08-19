import React from "react";
import PropTypes from "prop-types";

const PasswordReq = ({ validPassword, className }) => {
  const validPasswordCls = validPassword ? "" : " color-destructive";
  const passwordCls = ` {${className}}`;

  return (
    <div
      className={`color-hint password-requirements${validPasswordCls}${passwordCls}`}
    >
      Your password must meet the following requirements:
      <ul>
        <li>
          At least <b>8 characters</b>
        </li>
        <li>
          Include at least <b>1 number</b>
        </li>
        <li>
          Include at least <b>1 special character</b>
        </li>
        <li>
          Include <b>uppercase and lowercase characters</b>
        </li>
      </ul>
    </div>
  );
};

PasswordReq.propTypes = {
  validPassword: PropTypes.bool,
  className: PropTypes.string,
};

export default PasswordReq;
