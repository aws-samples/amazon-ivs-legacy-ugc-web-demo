import React, { Component } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import * as config from '../../config';
import * as util from '../util';

// Components
import Home from './Home';
import Channel from './Channel';
import Settings from './Settings';
import Messages from '../common/Messages';
import Header from '../common/Header';
import SignIn from './modals/SignIn';
import SignUp from './modals/SignUp';

// Mock data
import { mockStreams } from '../../__test__/mocks/streams-mocks';

class Layout extends Component {
  constructor() {
    super();
    this.state = {
      signedIn: false,
      checkedAuth: false,
      auth: {},
      userInfo: {},

      showSignIn: false,
      showSignUp: false,
      showSettings: false,

      showMessage: false,
      messageType: '',
      message: '',
    }
  }

  componentDidMount() {
    // Global keybinds
    document.addEventListener("keydown", this.handleKeyDown);

    // Get User Auth Data
    const auth = util.getWithExpiry('ugc');
    if (auth && Object.keys(auth).length) {
      this.setUserAuth(auth);
      this.getUserInfo(auth);
    } else {
      this.setState({ checkedAuth: true });
    }
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  async getUserInfo(auth) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user?access_token=${auth.AccessToken}`;
      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        this.setUserInfo(json);
      } else {
        throw new Error('Unable to get user information.')
      }
    } catch(error) {
      console.log(error.message);
    }
  }

  async changeAttribute(auth, name, key, value) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user/attr?access_token=${encodeURIComponent(auth.AccessToken)}`;
      const options = {
        method: 'POST',
        body: JSON.stringify({
          "Name": key,
          "Value": value
        })
      };

      const response = await fetch(url, options);
      if (response.status === 200) {
        this.onSuccess(`${name} changed`);
        this.getUserInfo(auth);
      } else {
        throw new Error(`Unable change ${name}`);
      }
    } catch(error) {
      console.log(error.message);
      this.onFailure(`Unable change ${name}`);
    }
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 27) { // keyCode 27 is Escape key
      if(this.state.showMessage) {
        this.setState({ showMessage: false });
      }
    }
  }

  handleSignOut = () => {
    util.removeSession('ugc');
    this.resetStates();

    if (config.USE_MOCK_DATA) {
      const { streams } = mockStreams;
      this.setState({ streams });
    } else {
      this.getLiveStreams();
    }
  }

  onSuccess = (message) => {
    this.setState({
      showMessage: true,
      messageType: 'success',
      message,
    }, () => {
      setTimeout(() => {
         this.setState({ showMessage: false });
      }, 5000);
    })
  }

  onFailure = (message) => {
    this.setState({
      showMessage: true,
      messageType: 'error',
      message
    }, () => {
      setTimeout(() => {
         this.setState({ showMessage: false });
      }, 5000);
    })
  }

  getCurrentPath = () => {
    const currentPath = util.getBasePath();
    return currentPath;
  }

  showSignIn = () => {
    this.setState({ showSignIn: true });
  }

  showSignUp = () => {
    this.setState({ showSignUp: true });
  }

  closeSignIn = () => {
    this.setState({ showSignIn: false });
  }

  closeSignUp = () => {
    this.setState({ showSignUp: false });
  }

  setUserInfo = (userInfo) => {
    const arr = userInfo && userInfo.UserAttributes ? userInfo.UserAttributes : [];
    const hash = Object.assign({}, ...arr.map(s => ({[s.Name]: s.Value})));

    this.setState({ signedIn: true, userInfo: hash, checkedAuth: true, });
  }

  setUserAuth = (auth) => {
    this.setState({ auth: auth, checkedAuth: false });
  }

  setAvatar = (avatar) => {
    this.setState({ avatar });
  }

  closeSettings = (isDeleteAccount) => {
    this.setUrlPath('');
    if (isDeleteAccount) {
      this.handleSignOut();
      this.setUrlPath(``);
    } else {
      this.setState({ showSettings: false });
    }
  }

  render() {
    const {
      auth,
      checkedAuth,
      userInfo,
      signedIn,
      showSignIn,
      showSignUp,
      showMessage,
      messageType,
      message
    } = this.state;

    // The logged-in user's info
    const { preferred_username, picture } = userInfo;
    const userAvatarUrl = util.getAvatarUrl(picture);
    // The current URL path from react-router
    const currentPath = this.props.location;

    // Render components based on route
    const { page } = this.props;
    let pageComponent = (
      <Home
        showSignIn={this.showSignIn}
        username={preferred_username}
        currentPath={currentPath}
        signedIn={signedIn}
      />
    );
    switch (page) {
      case 'CHANNEL':
        pageComponent = (
          <Channel
            auth={auth}
            checkedAuth={checkedAuth}
            onSuccess={this.onSuccess}
            onFailure={this.onFailure}
            changeAttribute={this.changeAttribute.bind(this)}
            userInfo={userInfo}
            username={preferred_username}
            signedIn={signedIn}
          />
        );
        break;
      case 'SETTINGS':
        if (signedIn) {
          pageComponent = (
            <Settings
              userInfo={userInfo}
              auth={auth}
              closeSettings={this.closeSettings}
              setAvatar={this.setAvatar}
              onSuccess={this.onSuccess}
              onFailure={this.onFailure}
              changeAttribute={this.changeAttribute}
              getUserInfo={this.getUserInfo}
              setUserInfo={this.setUserInfo}
            />
          );
        } else {
          pageComponent = (<Redirect to={{ pathname: '/' }} />);
        }
        break;
      default:
        pageComponent = (
          <Home
            showSignIn={this.showSignIn}
            username={preferred_username}
            currentPath={currentPath}
            signedIn={signedIn}
          />
        );
        break;
    }

    return(
      <React.Fragment>
        <Header
          avatar={picture}
          avatarImg={userAvatarUrl}
          checkedAuth={checkedAuth}
          handleSignIn={this.showSignIn}
          signedIn={signedIn}
          myChannel={preferred_username}
        />
        <Messages showMessage={showMessage} message={message} messageType={messageType} />
        {pageComponent}
        {showSignIn && (
          <SignIn
            closeSignIn={this.closeSignIn}
            showSignUp={this.showSignUp}
            getUserInfo={this.getUserInfo}
            setUserInfo={this.setUserInfo}
            setUserAuth={this.setUserAuth}
            handleAppClick={this.handleAppClick}
          />
        )}
        {showSignUp && (
          <SignUp
            closeSignUp={this.closeSignUp}
            showSignIn={this.showSignIn}
            setUserAuth={this.setUserAuth}
            getUserInfo={this.getUserInfo}
            setUserInfo={this.setUserInfo}
            handleAppClick={this.handleAppClick}
          />
        )}
      </React.Fragment>
    )
  }
}

export default withRouter(Layout);
