import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import * as util from "../../util";
import * as config from "../../../config";

// Components
import PasswordReq from "../../common/PasswordReq";
import Avatars from "../../common/Avatars";
import BgColor from "../../common/BgColor";

// Styles
import "./Auth.css";

const SignUp = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bgColor, setBgColor] = useState("");

  const [validEmail, setValidEmail] = useState(true);
  const [validPassword, setValidPassword] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [failedToSignUp, setFailedToSignUp] = useState(false);
  const [duplicateAccount, setDuplicateAccount] = useState(false);

  const inputRef = React.useRef();

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    inputRef.current.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      // keyCode 27 is Escape key
      props.closeSignUp();
    }
  };

  const signUp = async () => {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}signUp`;
      const options = {
        method: "POST",
        body: JSON.stringify({
          email: email,
          password: password,
          avatar: avatar,
          bgColor: bgColor,
          channelType:
            config.IVS_CHANNEL_TYPE.toUpperCase() === "BASIC"
              ? "BASIC"
              : "STANDARD",
          channelLatencyMode:
            config.IVS_LATENCY_MODE.toUpperCase() === "LOW" ? "LOW" : "NORMAL",
        }),
      };

      const response = await fetch(url, options);
      if (response.status === 201) {
        const json = await response.json();
        setFailedToSignUp(false);
        setProcessing(false);
        util.setWithExpiry(
          `ugc`,
          json.AuthenticationResult,
          json.AuthenticationResult.ExpiresIn
        );
        props.setUserAuth(json.AuthenticationResult);
        props.getUserInfo(json.AuthenticationResult);
        props.closeSignUp();
      } else {
        const errorMessage = await response.text();
        console.log(errorMessage);
        if (errorMessage.includes("UsernameExistsException")) {
          setDuplicateAccount(true);
        }
        throw new Error("Unable to signup");
      }
    } catch (error) {
      console.log(error.message);
      setFailedToSignUp(true);
      setProcessing(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleColorClick = (e, name) => {
    setBgColor(name);
  };

  const resetSignUp = () => {
    setValidEmail(true);
    setValidPassword(true);
    setProcessing(false);
    setFailedToSignUp(false);
    setDuplicateAccount(false);
  };

  const handleSignUp = (e) => {
    e.preventDefault();

    resetSignUp();

    const vEmail = util.validateEmail(email);
    const vPassword = util.validatePassword(password);

    if (vEmail && vPassword) {
      setProcessing(true);
      signUp();
    }

    setValidEmail(vEmail);
    setValidPassword(vPassword);
  };

  const handleAvatarClick = (e, name) => {
    setAvatar(name);
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    props.closeSignUp();
    props.showSignIn();
  };

  const signUpDisabled =
    !email ||
    !password ||
    !confirmPassword ||
    !avatar ||
    !bgColor ||
    processing ||
    password !== confirmPassword;
  const signUpText = processing ? "Processing..." : "Create Account";

  return (
    <div className="modal pos-absolute top-0 bottom-0">
      <div className="modal__el modal__el--full-height">
        <div className="modal_icon" onClick={props.closeSignUp}>
          <img src="/images/close_icon.svg" />
        </div>
        <div className="justify-center-wrapper">
          <h2 className="mg-b-2">Create account</h2>
          <form action="">
            <fieldset className="mg-b-2">
              <input
                type="email"
                placeholder="Email"
                autoComplete="new-password"
                value={email}
                ref={inputRef}
                onChange={handleEmailChange}
              />
              {email && !validEmail && (
                <div className="email-error-msg">Invalid email</div>
              )}
              {duplicateAccount && (
                <div className="email-error-msg">
                  That email has already been registered. Did you mean to{" "}
                  <span
                    className="email-sign-in-link"
                    onClick={handleLinkClick}
                  >
                    sign in
                  </span>
                  ?
                </div>
              )}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              <PasswordReq className="mg-b-2" validPassword={validPassword} />
              <div className="item-select-container pd-1 mg-b-1">
                <div className="mg-b-05">Select Avatar</div>
                <div className="avatars pos-relative item-select-grid">
                  <Avatars
                    currentAvatar={avatar}
                    handleAvatarClick={handleAvatarClick}
                  />
                </div>
              </div>
              <div className="item-select-container pd-1 mg-b-2">
                <div className="mg-b-05">Select Color</div>
                <div className="colors pos-relative item-select-grid">
                  <BgColor
                    bgColor={bgColor}
                    handleColorClick={handleColorClick}
                  />
                </div>
              </div>
              {failedToSignUp && (
                <div className="error-msg">Failed to sign up!</div>
              )}
              <button
                className="btn btn--primary"
                disabled={signUpDisabled}
                onClick={handleSignUp}
              >
                {signUpText}
              </button>
              <div className="create-account">
                Already have an account?{" "}
                <a
                  className="sign-in-link"
                  href="/signin"
                  onClick={handleLinkClick}
                >
                  Sign in
                </a>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
      <div className="modal__overlay" onClick={props.closeSignUp}></div>
    </div>
  );
};

SignUp.propTypes = {
  closeSignUp: PropTypes.func,
  showSignIn: PropTypes.func,
  setUserAuth: PropTypes.func,
  getUserInfo: PropTypes.func,
  setUserInfo: PropTypes.func,
};

export default SignUp;
