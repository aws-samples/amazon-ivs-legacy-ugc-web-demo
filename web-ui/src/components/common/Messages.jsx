import React from "react";
import PropTypes from "prop-types";

// Styles
import "./Messages.css";

const Messages = ({ showMessage, messageType, message }) => {
  return (
    <>
      {showMessage && messageType === "success" && (
        <div className="notice notice--success">
          <div className="notice__content">
            <div className="icon icon--24 notice__icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <p>{message}</p>
          </div>
        </div>
      )}
      {showMessage && messageType === "error" && (
        <div className="notice notice--error">
          <div className="notice__content">
            <div className="icon icon--24 notice__icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M0  0h24v24H0z" fill="none" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <p>{message}</p>
          </div>
        </div>
      )}
    </>
  );
};

Messages.propTypes = {
  showMessage: PropTypes.bool,
  message: PropTypes.string,
  messageType: PropTypes.string,
};

export default Messages;
