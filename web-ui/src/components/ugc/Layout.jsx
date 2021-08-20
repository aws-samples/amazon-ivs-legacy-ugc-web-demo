import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Redirect, withRouter } from "react-router-dom";
import * as config from "../../config";
import * as util from "../util";

// Components
import Home from "./Home";
import Channel from "./Channel";
import Settings from "./Settings";
import Messages from "../common/Messages";
import Header from "../common/Header";
import SignIn from "./modals/SignIn";
import SignUp from "./modals/SignUp";

// Mock data
import { mockStreams } from "../../__test__/mocks/streams-mocks";

const Layout = (props) => {
  const [signedIn, setSignedIn] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [auth, setAuth] = useState({});
  const [userInfo, setUserInfo] = useState({});

  const [showSignedIn, setShowSignedIn] = useState(false);
  const [showSignedUp, setShowSignedUp] = useState(false);

  const [showMessage, setShowMessage] = useState(false);
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Global keybinds
    document.addEventListener("keydown", handleKeyDown);

    // Get User Auth Data
    const auth = util.getWithExpiry("ugc");
    if (auth && Object.keys(auth).length) {
      setUserAuth(auth);
      getUserInfo(auth);
    } else {
      setCheckedAuth(true);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getUserInfo = async (auth) => {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user?access_token=${auth.AccessToken}`;
      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        handleUserInfo(json);
      } else {
        throw new Error("Unable to get user information.");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const changeAttribute = async (auth, name, key, value) => {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user/attr?access_token=${encodeURIComponent(
        auth.AccessToken
      )}`;
      const options = {
        method: "POST",
        body: JSON.stringify({
          Name: key,
          Value: value,
        }),
      };

      const response = await fetch(url, options);
      if (response.status === 200) {
        onSuccess(`${name} changed`);
        getUserInfo(auth);
      } else {
        throw new Error(`Unable change ${name}`);
      }
    } catch (error) {
      console.log(error.message);
      onFailure(`Unable change ${name}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      // keyCode 27 is Escape key
      if (showMessage) {
        setShowMessage(false);
      }
    }
  };

  const handleSignOut = () => {
    util.removeSession("ugc");
    resetStates();

    if (config.USE_MOCK_DATA) {
      const { streams } = mockStreams;
      setStreams(streams);
    } else {
      getLiveStreams();
    }
  };

  const onSuccess = (message) => {
    setShowMessage(true);
    setMessageType("success");
    setMessage(message);

    setTimeout(() => {
      setShowMessage(false);
    }, 5000);
  };

  const onFailure = (message) => {
    setShowMessage(true);
    setMessageType("error");
    setMessage(message);

    setTimeout(() => {
      setShowMessage(false);
    }, 5000);
  };

  const showSignIn = () => {
    setShowSignedIn(true);
  };

  const showSignUp = () => {
    setShowSignedUp(true);
  };

  const closeSignIn = () => {
    setShowSignedIn(false);
  };

  const closeSignUp = () => {
    setShowSignedUp(false);
  };

  const handleUserInfo = (userInfo) => {
    const arr =
      userInfo && userInfo.UserAttributes ? userInfo.UserAttributes : [];
    const hash = Object.assign({}, ...arr.map((s) => ({ [s.Name]: s.Value })));

    setSignedIn(true);
    setUserInfo(hash);
    setCheckedAuth(true);
  };

  const setUserAuth = (auth) => {
    setAuth(auth);
    setCheckedAuth(false);
  };

  const closeSettings = (isDeleteAccount) => {
    setUrlPath("");
    if (isDeleteAccount) {
      handleSignOut();
      setUrlPath(``);
    }
  };

  // The logged-in user's info
  const { preferred_username, picture } = userInfo;
  const userAvatarUrl = util.getAvatarUrl(picture);
  // The current URL path from react-router
  const currentPath = props.location;

  // Render components based on route
  const { page } = props;
  const pageComponent = () => {
    switch (page) {
      case "CHANNEL":
        return (
          <Channel
            auth={auth}
            checkedAuth={checkedAuth}
            onSuccess={onSuccess}
            onFailure={onFailure}
            changeAttribute={changeAttribute}
            userInfo={userInfo}
            username={preferred_username}
            signedIn={signedIn}
          />
        );
      case "SETTINGS":
        if (signedIn) {
          return (
            <Settings
              userInfo={userInfo}
              auth={auth}
              closeSettings={closeSettings}
              onSuccess={onSuccess}
              onFailure={onFailure}
              changeAttribute={changeAttribute}
              getUserInfo={getUserInfo}
              setUserInfo={handleUserInfo}
            />
          );
        } else {
          return <Redirect to={{ pathname: "/" }} />;
        }
      default:
        return (
          <Home
            showSignIn={showSignIn}
            username={preferred_username}
            currentPath={currentPath}
            signedIn={signedIn}
          />
        );
    }
  };

  return (
    <React.Fragment>
      <Header
        avatar={picture}
        avatarImg={userAvatarUrl}
        checkedAuth={checkedAuth}
        handleSignIn={showSignIn}
        signedIn={signedIn}
        myChannel={preferred_username}
      />
      <Messages
        showMessage={showMessage}
        message={message}
        messageType={messageType}
      />
      {pageComponent()}
      {showSignedIn && (
        <SignIn
          closeSignIn={closeSignIn}
          showSignUp={showSignUp}
          getUserInfo={getUserInfo}
          setUserInfo={handleUserInfo}
          setUserAuth={setUserAuth}
        />
      )}
      {showSignedUp && (
        <SignUp
          closeSignUp={closeSignUp}
          showSignIn={showSignIn}
          setUserAuth={setUserAuth}
          getUserInfo={getUserInfo}
          setUserInfo={handleUserInfo}
        />
      )}
    </React.Fragment>
  );
};

export default withRouter(Layout);

Layout.propTypes = {
  location: PropTypes.object,
  page: PropTypes.string,
};
