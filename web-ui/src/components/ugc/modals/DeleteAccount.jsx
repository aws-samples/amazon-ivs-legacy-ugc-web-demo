import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as util from "../../util";

// Styles
import "./DeleteAccount.css";

const DeleteAccount = (props) => {
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      // keyCode 27 is Escape key
      props.closeDelete();
    }
  };

  handleDeleteAccount = (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteAccount(props.auth);
  };

  const deleteAccount = async (auth) => {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user/delete?access_token=${encodeURIComponent(
        auth.AccessToken
      )}`;

      const response = await fetch(url);
      if (response.status === 200) {
        props.onSuccess("User account deleted");
        props.closeDelete();
        props.closeSettings(true);
      } else {
        const message = await response.text();
        if (message.includes("UserNotFoundException")) {
          props.closeDelete();
          props.closeSettings(true);
          props.onFailure("User account already delete");
        } else {
          throw new Error("Unable to delete user.");
        }
      }
    } catch (error) {
      console.log(error.message);
      props.onFailure("Failed to delete account");
    }
  };

  return (
    <div className="delete-account modal pos-absolute top-0 bottom-0">
      <div className="modal__el">
        <h2>Are you sure you would like to delete your account?</h2>
        <div className="buttons mg-t-4">
          <button className="btn btn--primary" onClick={props.closeDelete}>
            Cancel
          </button>
          <button className="btn btn--destruct" onClick={handleDeleteAccount}>
            Delete
          </button>
        </div>
      </div>
      <div className="modal__overlay"></div>
    </div>
  );
};

DeleteAccount.propTypes = {
  auth: PropTypes.object,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  closeDelete: PropTypes.func,
  closeSettings: PropTypes.func,
};

export default DeleteAccount;
