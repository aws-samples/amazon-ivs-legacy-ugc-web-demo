import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as util from '../../util';
import * as config from '../../../config';

// Components
import PasswordReq from '../../common/PasswordReq';
import Avatars from '../../common/Avatars';
import BgColor from '../../common/BgColor';

// Styles
import './Auth.css';

class SignUp extends Component {
  constructor() {
    super ();
    this.state = {
      email: '',
      password: '',
      confirmPassword: '',
      avatar: '',
      bgColor: '',

      validEmail: true,
      validPassword: true,
      processing: false,
      failedToSignUp: false,
      duplicateAccount: false
    }
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
    this.inputRef.current.focus();
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 27) { // keyCode 27 is Escape key
      this.props.closeSignUp();
    }
  }

  async signUp() {
    try {
      const { email, password, avatar, bgColor } = this.state;
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}signUp`;
      const options = {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          password: password,
          avatar: avatar,
          bgColor: bgColor,
          channelType: config.IVS_CHANNEL_TYPE.toUpperCase() === 'BASIC' ? 'BASIC' : 'STANDARD',
          channelLatencyMode: config.IVS_LATENCY_MODE.toUpperCase() === 'LOW' ? 'LOW' : 'NORMAL'
        })
      };

      const response = await fetch(url, options);
      if (response.status === 201) {
        const json = await response.json();
        this.setState({ failedToSignUp: false, processing: false }, () => {
          util.setWithExpiry(`ugc`, json.AuthenticationResult, json.AuthenticationResult.ExpiresIn);
          this.props.setUserAuth(json.AuthenticationResult);
          this.props.getUserInfo(json.AuthenticationResult);
          this.props.closeSignUp();
        });
      } else {
        const errorMessage = await response.text();
        console.log(errorMessage)
        if (errorMessage.includes('UsernameExistsException')) {
          this.setState({ duplicateAccount: true });
        }
        throw new Error('Unable to signup');
      }
    } catch(error) {
      console.log(error.message);
      this.setState({ failedToSignUp: true, processing: false });
    }
  }

  handleEmailChange = (e) => {
    this.setState({ email: e.target.value })
  }

  handlePasswordChange = (e) => {
    this.setState({ password: e.target.value })
  }

  handleConfirmPasswordChange = (e) => {
    this.setState({ confirmPassword: e.target.value })
  }

  handleColorClick = (e, name) => {
    this.setState({ bgColor: name });
  }

  resetSignUp = () => {
    this.setState({
      validEmail: true,
      validPassword: true,
      processing: false,
      failedToSignUp: false,
      duplicateAccount: false
    });
  }

  handleSignUp = (e) => {
    e.preventDefault();

    this.resetSignUp();

    const validEmail = util.validateEmail(this.state.email);
    const validPassword = util.validatePassword(this.state.password);

    this.setState({ validEmail, validPassword }, () => {
      if (validEmail && validPassword) {
        this.setState({ processing: true }, () => {
          this.signUp();
        })
      }
    });
  }

  handleAvatarClick = (e, name) => {
    this.setState({ avatar: name });
  }

  handleLinkClick = (e) => {
    e.preventDefault();
    this.props.closeSignUp();
    this.props.showSignIn();
  }

  render() {
    const { email, password, confirmPassword, avatar, bgColor, processing, validEmail, validPassword, failedToSignUp, duplicateAccount } = this.state;
    const signUpDisabled = !email || !password || !confirmPassword || !avatar || !bgColor || processing || (password !== confirmPassword);
    const signUpText = processing ? 'Processing...' : 'Create Account';

    return (
      <div className="modal pos-absolute top-0 bottom-0">
        <div className="modal__el modal__el--full-height">
          <div className="justify-center-wrapper">
            <h2 className="mg-b-2">Create account</h2>
            <form action="">
              <fieldset className="mg-b-2">
                <input type="email" placeholder="Email" autoComplete="new-password" value={email} ref={this.inputRef} onChange={this.handleEmailChange} />
                {email && !validEmail && (
                  <div className="email-error-msg">Invalid email</div>
                )}
                {duplicateAccount && (
                  <div className="email-error-msg">That email has already been registered. Did you mean to <span className="email-sign-in-link" onClick={this.handleLinkClick}>sign in</span>?</div>
                )}
                <input type="password" placeholder="Password" value={password} onChange={this.handlePasswordChange} />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={this.handleConfirmPasswordChange} />
                <PasswordReq className="mg-b-2" validPassword={validPassword} />
                <div className="item-select-container pd-1 mg-b-1">
                  <div className="mg-b-05">Select Avatar</div>
                  <div className="avatars pos-relative item-select-grid">
                    <Avatars avatar={avatar} handleAvatarClick={this.handleAvatarClick} />
                  </div>
                </div>
                <div className="item-select-container pd-1 mg-b-2">
                  <div className="mg-b-05">Select Color</div>
                  <div className="colors pos-relative item-select-grid">
                    <BgColor bgColor={bgColor} handleColorClick={this.handleColorClick} />
                  </div>
                </div>
                {failedToSignUp && (
                  <div className="error-msg">Failed to sign up!</div>
                )}
                <button className="btn btn--primary" disabled={signUpDisabled} onClick={this.handleSignUp}>{signUpText}</button>
                <div className="create-account">Already have an account? <a className="sign-in-link" href="/signin" onClick={this.handleLinkClick}>Sign in</a></div>
              </fieldset>
            </form>
          </div>
        </div>
        <div className="modal__overlay" onClick={this.props.closeSignUp}></div>
      </div>
    )
  }
}

SignUp.propTypes = {
  closeSignUp: PropTypes.func,
  showSignIn: PropTypes.func,
  setUserAuth: PropTypes.func,
  getUserInfo: PropTypes.func,
  setUserInfo: PropTypes.func,
  handleAppClick: PropTypes.func
};

export default SignUp;
