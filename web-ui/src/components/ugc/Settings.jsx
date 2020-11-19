import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as util from '../util';

// Components
import DeleteAccount from './modals/DeleteAccount';
import PasswordReq from '../common/PasswordReq';
import Avatars from '../common/Avatars';
import BgColor from '../common/BgColor';
import SettingsField from './SettingsField';

// Styles
import './Settings.css';

class Settings extends Component {
  constructor() {
    super ();
    this.state = {
      oldPassword: '',
      password: '',
      confirmPassword: '',
      validPassword: true,
      showDelete: false,
      streamKeyResetDisabled: false,
    }
    this.newPasswordRef = React.createRef();
    this.confirmPasswordRef = React.createRef();
  }

  async resetStreamKey(auth) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}channels/default/streamKey/reset?access_token=${encodeURIComponent(auth.AccessToken)}`;

      const response = await fetch(url);
      if (response.status === 200) {
        this.props.onSuccess('Stream Key reset');
        const json = await response.json();
        this.setState({
          streamKey: json.streamKey.value,
          streamKeyResetDisabled: false
        });
      } else {
        this.setState({ streamKeyResetDisabled: false });
        throw new Error('Unable to reset stream key');
      }
    } catch(error) {
      console.log(error.message);
      this.setState({ streamKeyResetDisabled: false });
      this.props.onFailure('Unable to reset stream key');
    }
  }

  async changePassword(auth, oldPassword, newPassword) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}user/changePassword?access_token=${encodeURIComponent(auth.AccessToken)}`;
      const options = {
        method: 'POST',
        body: JSON.stringify({
          "oldPassword": oldPassword,
          "newPassword": newPassword
        })
      };

      const response = await fetch(url, options);
      if (response.status === 200) {
        this.props.onSuccess(`Password changed`);
        this.setState({ oldPassword: '', password: '', confirmPassword: '' });
      } else {
        throw new Error(`Unable change password`);
      }
    } catch(error) {
      console.log(error.message);
      this.props.onFailure(`Unable change password`);
    }
  }

  handleStreamKeyReset = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({streamKeyResetDisabled: true});
    this.resetStreamKey(this.props.auth);
  }

  handleStreamKeyCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.copyText('stream-key-id', "Copied stream key");
  }

  handleStreamKeyFocus = (e) => {
    e.target.select();
    this.handleStreamKeyCopy(e);
  }

  handleServerCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.copyText('ingest-server-id', "Copied ingest server URL");
  }

  handleServerFocus = (e) => {
    e.target.select();
    this.handleServerCopy(e);
  }

  handleUsernameChange = (e) => {
    this.setState({ username: e.target.value })
  }

  handleUsernameSave = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.changeAttribute(this.props.auth, 'Username', 'preferred_username', username);
  }

  handleUsernameKeyDown = (e, username) => {
    if (e.keyCode === 13 && username) { // keyCode 13 is carriage return
      this.props.changeAttribute(this.props.auth, 'Username', 'preferred_username', username);
    }
  }

  handleOldPasswordChange = (e) => {
    this.setState({ oldPassword: e.target.value })
  }

  handlePasswordChange = (e) => {
    this.setState({ password: e.target.value })
  }

  handleConfirmPasswordChange = (e) => {
    this.setState({ confirmPassword: e.target.value })
  }

  handlePasswordSave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const { oldPassword, password } = this.state;
    const validPassword = util.validatePassword(password);
    this.setState({ validPassword }, () => {
      if (!validPassword) {
        this.props.onFailure('Invalid password');
      } else {
        this.changePassword(this.props.auth, oldPassword, password);
      }
    });
  }

  oldPasswordKeyDown = (e, oldPassword) => {
    if (e.keyCode === 13 && oldPassword) { // keyCode 13 is carriage return
      this.newPasswordRef.current.focus();
    }
  }

  newPasswordKeyDown = (e, newPassword) => {
    if (e.keyCode === 13 && newPassword) { // keyCode 13 is carriage return
      this.confirmPasswordRef.current.focus();
    }
  }

  confirmPasswordKeyDown = (e, confirmPassword) => {
    if (e.keyCode === 13 && confirmPassword) { // keyCode 13 is carriage return
      const { oldPassword, password } = this.state;
      const validPassword = util.validatePassword(password);
      this.setState({ validPassword }, () => {
        if (!validPassword) {
          this.props.onFailure('Invalid password');
        } else {
          this.changePassword(this.props.auth, oldPassword, password);
        }
      });
    }
  }

  handleAvatarClick = (e, name) => {
    this.setState({ avatar: name }, () => {
      this.props.changeAttribute(this.props.auth, 'Avatar', 'picture', name);
      this.props.setAvatar(name);
    });
  }

  handleColorClick = (e, name) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ bgColor: name }, () => {
      const bgColorValue = { "bgColor": name };
      this.props.changeAttribute(this.props.auth, 'Color', 'profile', bgColorValue);
    });
  }

  handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showDelete: true });
  }

  closeDelete = () => {
    this.setState({ showDelete: false });
  }

  copyText = (id, message) => {
    /* Get the text field */
    var copyText = document.getElementById(id);

    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    /* Copy the text inside the text field */
    document.execCommand("copy");

    util.copyTextToClipboard(copyText.value);

    /* Alert the copied text */
    if (message) {
      this.props.onSuccess(`${message}`);
    } else {
      this.props.onSuccess(`Copied the text: ${copyText.value}`);
    }
  }

  render() {
    const {
      streamKey,
      streamKeyResetDisabled,
      ingestServer,
      username,
      oldPassword,
      password,
      confirmPassword,
      avatar,
      bgColor,
      validPassword,
      showDelete
    } = this.state;

    const { userInfo, auth, onSuccess, onFailure } = this.props;

    const userInfoValid = Object.keys(userInfo).length ? true : false;

    const currentUsername = (username !== undefined) ? username : (userInfoValid ? userInfo.preferred_username : '');
    const currentBgColor = (bgColor !== undefined) ? bgColor : (userInfoValid ? userInfo.profile.bgColor : '');
    const currentAvatar = (avatar !== undefined) ? avatar : (userInfoValid ? userInfo.picture : '');

    let currentIngestServer = (ingestServer !== undefined) ? ingestServer : (userInfoValid ? userInfo.profile.defaultChannelDetails.channel.ingestEndpoint : '');
    if (currentIngestServer) {
      currentIngestServer = `rtmps://${currentIngestServer}/app/`
    }

    let currentStreamKey = '';
    if (streamKey !== undefined) {
      currentStreamKey = streamKey;
    } else if (userInfoValid) {
      currentStreamKey = userInfo.profile.defaultChannelDetails.streamKey.value || userInfo.profile.defaultChannelDetails.streamKey.streamKey.value;
    }

    const streamKeyCopyDisabled = !currentStreamKey;
    const ingestServerCopyDisabled = !currentIngestServer;
    const usernameSaveDisabled = !currentUsername;
    const passwordSaveDisabled = !password || !confirmPassword || (password !== confirmPassword);

    return (
      <React.Fragment>
        <div className="main full-width full-height">
          <div className="settings-wrapper mg-2">
            <h2 className="mg-b-2">Settings</h2>
            <fieldset className="mg-b-2">
              <SettingsField
                labelName="Stream Key"
                inputId="stream-key-id"
                className="mg-b-1"
              >
                <input id="stream-key-id" className="settings-read-only-input mono-text mg-b-0 mg-r-1" type="text" placeholder="Key" value={currentStreamKey} onFocus={this.handleStreamKeyFocus} readOnly />
                <button className="btn btn--destruct btn--settings mg-b-0 mg-r-1" onClick={this.handleStreamKeyReset} disabled={streamKeyResetDisabled}>Reset</button>
                <button className="btn btn--primary btn--settings mg-b-0" disabled={streamKeyCopyDisabled} onClick={this.handleStreamKeyCopy}>Copy</button>
              </SettingsField>

              <SettingsField
                labelName="Ingest Server"
                inputId="ingest-server-id"
                className="mg-b-3"
              >
                <input id="ingest-server-id" className="settings-read-only-input mono-text mg-b-0 mg-r-1" type="text" placeholder="Server" value={currentIngestServer} onFocus={this.handleServerFocus} readOnly />
                <button className="btn btn--primary btn--settings mg-b-0" disabled={ingestServerCopyDisabled} onClick={this.handleServerCopy}>Copy</button>
              </SettingsField>

              <SettingsField
                labelName="Username"
                inputId="username-id"
                className="mg-b-3"
              >
                <input
                  className="mg-b-0 mg-r-1"
                  id="username-id"
                  type="text"
                  placeholder="Username"
                  value={currentUsername}
                  autoComplete="new-password"
                  onKeyDown={(e) => this.handleUsernameKeyDown(e, currentUsername)}
                  onChange={this.handleUsernameChange}
                />
                <button className="btn btn--primary btn--settings mg-b-0" disabled={usernameSaveDisabled} onClick={(e) => this.handleUsernameSave(e, currentUsername)}>Save</button>
              </SettingsField>

              <SettingsField
                labelName="Current Password"
                inputId="current-password-id"
                className="mg-b-1"
              >
                <input
                  className="mg-b-0 settings-input-right-margin"
                  id="current-password-id"
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onKeyDown={(e) => this.oldPasswordKeyDown(e, oldPassword)}
                  onChange={this.handleOldPasswordChange}
                />
              </SettingsField>

              <SettingsField
                labelName="New Password"
                inputId="new-password-id"
                className="mg-b-1"
              >
                <input
                  className="mg-b-0 settings-input-right-margin"
                  id="new-password-id"
                  ref={this.newPasswordRef}
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onKeyDown={(e) => this.newPasswordKeyDown(e, password)}
                  onChange={this.handlePasswordChange}
                />
              </SettingsField>

              <SettingsField
                labelName="Confirm Password"
                inputId="confirm-password-id"
                className="mg-b-1"
              >
                <input
                  className="mg-b-0 mg-r-1"
                  id="confirm-password-id"
                  ref={this.confirmPasswordRef}
                  type="password"
                  placeholder="Password"
                  value={confirmPassword}
                  onKeyDown={(e) => this.confirmPasswordKeyDown(e, confirmPassword)}
                  onChange={this.handleConfirmPasswordChange}
                />
                <button className="btn btn--primary btn--settings mg-b-0" disabled={passwordSaveDisabled} onClick={this.handlePasswordSave}>Save</button>
              </SettingsField>
              <div className="settings-field mg-b-3">
                <div className="spacer"></div>
                <PasswordReq validPassword={validPassword} />
              </div>

              <SettingsField
                labelName="Avatar"
                inputId="avatar-id"
                className="mg-b-1"
              >
                <div className="item-select-container settings-input-right-margin pd-1">
                  <div className={`avatars pos-relative item-select-grid item-select-grid--small`}>
                    <Avatars
                      avatar={currentAvatar}
                      handleAvatarClick={this.handleAvatarClick}
                    />
                  </div>
                </div>
              </SettingsField>

              <SettingsField
                labelName="Color"
                inputId="color-id"
                className="mg-b-25"
              >
                <div className="item-select-container settings-input-right-margin pd-1">
                  <div className={`colors pos-relative item-select-grid item-select-grid--small`}>
                    <BgColor
                      bgColor={currentBgColor}
                      handleColorClick={this.handleColorClick}
                    />
                  </div>
                </div>
              </SettingsField>

              <SettingsField
                labelName="Delete Account"
                inputId="delete-account-id"
              >
                <button className="btn btn--destruct btn--auto-width mg-b-0 pd-x-2" onClick={this.handleDeleteClick}>Delete my account</button>
              </SettingsField>
            </fieldset>
          </div>
        </div>
        {showDelete && (
          <DeleteAccount onSuccess={onSuccess} onFailure={onFailure} closeSettings={this.props.closeSettings} closeDelete={this.closeDelete} auth={auth} />
        )}
      </React.Fragment>
    )
  }
}

Settings.propTypes = {
  userInfo: PropTypes.object,
  auth: PropTypes.object,
  closeSettings: PropTypes.func,
  setAvatar: PropTypes.func,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  changeAttribute: PropTypes.func,
  getUserInfo: PropTypes.func,
  setUserInfo: PropTypes.func
};

export default Settings;
