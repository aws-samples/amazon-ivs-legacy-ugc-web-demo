import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import * as util from '../util';

class Header extends Component {
  constructor() {
    super();
    this.state = {
      showAvatarOptions: false
    }

    this.menuRef = React.createRef();
    this.setMenuRef = this.setMenuRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  setMenuRef(node) {
    this.menuRef = node;
  }

  handleSignIn = (e) => {
    e.preventDefault();
    this.props.handleSignIn();
  }

  handleSignOut = (e, redirectUrl) => {
    e.preventDefault();
    util.removeSession('ugc');
    this.props.history.go(0); // refresh the page
  }

  handleClickOutside = (e) => {
    if (this.menuRef.current) {
      const clickOutside = this.menuRef && !this.menuRef.current.contains(e.target);
      if (clickOutside) { this.toggleUserMenu(); }
    }
  }

  toggleUserMenu = () => {
    const showAvatar = this.state.showAvatarOptions;
    this.setState({ showAvatarOptions: !showAvatar });
  }

  render() {
    const {
      avatar,
      avatarImg,
      checkedAuth,
      signedIn,
      myChannel
    } = this.props;

    const {
      showAvatarOptions
    } = this.state;

    const basePath = util.getBasePath();

    let actionItem = (
      <div></div>
    );

    if (checkedAuth) {
      if (signedIn) {
        actionItem = (
          <React.Fragment>
            <button
              className="btn btn--interactive header-avatar-btn pos-absolute"
              onClick={this.toggleUserMenu}>
              <img
                className="header-avatar"
                src={avatarImg}
                alt={avatar}
              />
            </button>
            {showAvatarOptions && (
              <div className="avatar-options" ref={this.menuRef}>
                <Link className="btn avatar-options-link" to={`${basePath}channel/${myChannel}`} onClick={this.toggleUserMenu}>My Channel</Link>
                <Link className="btn avatar-options-link" to={`${basePath}settings`} onClick={this.toggleUserMenu}>Settings</Link>
                <a className="btn avatar-options-link" href={`${basePath}`} onClick={ e => this.handleSignOut(e, `${basePath}`) }>Sign Out</a>
              </div>
            )}
          </React.Fragment>
        );
      } else {
        actionItem = (
          <button className="btn btn--primary btn--header pd-x-15" onClick={this.handleSignIn.bind(this)}>Sign In</button>
        );
      }
    }

    return(
      <header>
        <div className="grid grid--2">
          <span>
            <Link className="h1 home" to={`${basePath}`}>ACME Stream</Link>
          </span>
          <div className="action-container">
            {actionItem}
          </div>
        </div>
      </header>
    )
  }
}

Header.propTypes = {
  avatar: PropTypes.string,
  avatarImg: PropTypes.string,
  handleSignIn: PropTypes.func,
  signedIn: PropTypes.bool,
  myChannel: PropTypes.string
};

export default withRouter(Header);
