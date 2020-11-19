import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as util from '../../util';

// Styles
import './Auth.css';

class SignIn extends Component {
  constructor() {
    super ();
    this.state = {
      email: '',
      password: '',

      validEmail: true,
      processing: false,
      unauthorized: false
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

  async signIn(email, password) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}auth`;
      const options = {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          password: password,
        })
      };

      const response = await fetch(url, options);
      if (response.status === 200) {
        const json = await response.json();
        this.setState({ unauthorized: false, processing: false, auth: json.AuthenticationResult }, () => {
          util.setWithExpiry(`ugc`, json.AuthenticationResult, json.AuthenticationResult.ExpiresIn);
          this.props.setUserAuth(json.AuthenticationResult);
          this.props.getUserInfo(json.AuthenticationResult);
          this.props.closeSignIn();
        });
      } else {
        throw new Error('Unable to signin');
      }
    } catch(error) {
      console.log(error.message);
      this.setState({ unauthorized: true, processing: false });
    }
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 27) { // keyCode 27 is Escape key
      this.props.closeSignIn();
    }
  }

  handleEmailChange = (e) => {
    this.setState({ email: e.target.value })
  }

  handlePasswordChange = (e) => {
    this.setState({ password: e.target.value })
  }

  handleLinkClick = (e) => {
    e.preventDefault();
    this.props.closeSignIn();
    this.props.showSignUp();
  }

  resetSignIn = () => {
    this.setState({
      validEmail: true,
      processing: false,
      unauthorized: false
    });
  }

  handleSignIn = (e) => {
    e.nativeEvent.stopImmediatePropagation();
    const { email, password } = this.state;

    this.resetSignIn();

    const validEmail = util.validateEmail(email);
    this.setState({ validEmail }, () => {
      if (validEmail) {
        this.setState({ processing: true }, () => {
          this.signIn(email, password);
        })
      }
    });
  }

  render() {
    const { email, password, processing, unauthorized, validEmail } = this.state;
    const signInDisabled = !email || !password || processing;
    const signInText = processing ? 'Processing...' : 'Sign In';

    return (
      <div className="modal pos-absolute top-0 bottom-0">
        <div className="modal__el modal__el--full-height">
          <div className="justify-center-wrapper">
            <h2 className="mg-b-2">Sign in</h2>
            <form action="">
              <fieldset className="mg-b-2">
                <input type="email" placeholder="Email" autoComplete="new-password" value={email} ref={this.inputRef} onChange={this.handleEmailChange} />
                {!validEmail && (
                  <div className="email-error-msg">Invalid email</div>
                )}
                <input type="password" placeholder="Password" value={password} onChange={this.handlePasswordChange} />
                {unauthorized && (
                  <div className="error-msg">Your username and password combination was not found.</div>
                )}
                <button className="mg-t-1 btn btn--primary" disabled={signInDisabled} onClick={this.handleSignIn}>{signInText}</button>
                <div className="create-account">Don't have an account? <a className="create-account-link" href="/signup" onClick={this.handleLinkClick}>Create account</a></div>
              </fieldset>
            </form>
          </div>
        </div>
        <div className="modal__overlay" onClick={this.props.closeSignIn}></div>
      </div>
    )
  }
}

SignIn.propTypes = {
  closeSignIn: PropTypes.func,
  showSignUp: PropTypes.func,
  getUserInfo: PropTypes.func,
  setUserInfo: PropTypes.func,
  setUserAuth: PropTypes.func,
  handleAppClick: PropTypes.func
};

export default SignIn;
