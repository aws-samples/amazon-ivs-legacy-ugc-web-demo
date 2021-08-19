import React, { useState, useEffect, useRef } from "react";
import { withRouter, Link } from "react-router-dom";
import PropTypes from "prop-types";
import * as util from "../util";

const Header = (props) => {
  const { avatar, avatarImg, checkedAuth, signedIn, myChannel, handleSignIn } =
    props;
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const menuRef = React.createRef();

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = (e, redirectUrl) => {
    e.preventDefault();
    util.removeSession("ugc");
    history.go(0); // refresh the page
  };

  const handleClickOutside = (e) => {
    if (menuRef.current) {
      const clickOutside = menuRef && !menuRef.current.contains(e.target);
      if (clickOutside) {
        toggleUserMenu();
      }
    }
  };

  const toggleUserMenu = () => {
    setShowAvatarOptions(!showAvatarOptions);
  };

  const basePath = util.getBasePath();
  let actionItem = <div></div>;

  if (checkedAuth) {
    if (signedIn) {
      actionItem = (
        <>
          <button
            className="btn btn--interactive header-avatar-btn pos-absolute"
            onClick={toggleUserMenu}
          >
            <img className="header-avatar" src={avatarImg} alt={avatar} />
          </button>
          {showAvatarOptions && (
            <div className="avatar-options" ref={menuRef}>
              <Link
                className="btn avatar-options-link"
                to={`${basePath}channel/${myChannel}`}
                onClick={toggleUserMenu}
              >
                My Channel
              </Link>
              <Link
                className="btn avatar-options-link"
                to={`${basePath}settings`}
                onClick={toggleUserMenu}
              >
                Settings
              </Link>
              <a
                className="btn avatar-options-link"
                href={`${basePath}`}
                onClick={(e) => handleSignOut(e, `${basePath}`)}
              >
                Sign Out
              </a>
            </div>
          )}
        </>
      );
    } else {
      actionItem = (
        <button
          className="btn btn--primary btn--header pd-x-15"
          onClick={handleSignIn}
        >
          Sign In
        </button>
      );
    }
  }

  return (
    <header>
      <div className="grid grid--2">
        <span>
          <Link className="h1 home" to={`${basePath}`}>
            ACME Stream
          </Link>
        </span>
        <div className="action-container">{actionItem}</div>
      </div>
    </header>
  );
};

Header.propTypes = {
  avatar: PropTypes.string,
  avatarImg: PropTypes.string,
  handleSignIn: PropTypes.func,
  signedIn: PropTypes.bool,
  myChannel: PropTypes.string,
  history: PropTypes.object,
  checkedAuth: PropTypes.bool,
};

export default withRouter(Header);
