import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as util from '../../util';

// Styles
import './DeleteAccount.css';

class DeleteAccount extends Component {

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 27) { // keyCode 27 is Escape key
      this.props.closeDelete();
    }
  }

  handleDeleteAccount = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.deleteAccount(this.props.auth);
  }

  async deleteAccount(auth) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user/delete?access_token=${encodeURIComponent(auth.AccessToken)}`;

      const response = await fetch(url);
      if (response.status === 200) {
        this.props.onSuccess('User account deleted');
        this.props.closeDelete();
        this.props.closeSettings(true);
      } else {
        const message = await response.text();
        if (message.includes('UserNotFoundException')) {
          this.props.closeDelete();
          this.props.closeSettings(true);
          this.props.onFailure('User account already delete');
        } else {
          throw new Error('Unable to delete user.');
        }
      }
    } catch(error) {
      console.log(error.message);
      this.props.onFailure('Failed to delete account');
    }
  }

  render() {
    return (
      <div className="delete-account modal pos-absolute top-0 bottom-0">
        <div className="modal__el">
          <h2>Are you sure you would like to delete your account?</h2>
          <div className="buttons mg-t-4">
            <button className="btn btn--primary" onClick={this.props.closeDelete}>Cancel</button>
            <button className="btn btn--destruct" onClick={this.handleDeleteAccount}>Delete</button>
          </div>
        </div>
        <div className="modal__overlay"></div>
      </div>
    )
  }
}

DeleteAccount.propTypes = {
  auth: PropTypes.object,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  closeDelete: PropTypes.func,
  closeSettings: PropTypes.func
};

export default DeleteAccount;