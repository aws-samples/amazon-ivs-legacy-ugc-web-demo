import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import * as config from '../../config';
import * as util from '../util';

// Components
import VideoPlayer from '../videoPlayer/VideoPlayer';
import HowToStream from './HowToStream';

// Mock data
import { mockStreams } from '../../__test__/mocks/streams-mocks';

class Channel extends Component {
  constructor() {
    super();
    this.state = {
      userInfo: {},
      signedIn: false,

      streamId: '',
      currentStream: {},
      elapsedStreaming: '',
      gotStreams: false,

      avatar: '',

      showMessage: false,
      messageType: '',
      message: '',
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);

    // Get current channel's username from the URL params
    const username = this.props.match.params.user;

    // Set the streamId to the current channel's username
    this.setState({
      streamId: username
    });

    // Set the currentStream object to the correct stream
    if (config.USE_MOCK_DATA) {
      // If using mock data, search mock data for the current stream.
      const { streams } = mockStreams;
      const currentStream = streams.filter(stream => stream.username === username);
      this.setState({
        currentStream: currentStream[0],
        avatar: currentStream[0]["avatar"],
        gotStreams: true
      });
    } else {
      // If using real data, fetch streams using the API
      this.getAndSetStreamInfo(username);
    }
  }

  componentDidUpdate(prevProps) {
    const username = this.props.match.params.user;
    if (this.props.match.params.user !== prevProps.match.params.user) {
      this.stopStreamTimeout();

      // Set the streamId to the current channel's username
      this.setState({
        streamId: username
      });

      // Set the currentStream object to the correct stream
      if (config.USE_MOCK_DATA) {
        // If using mock data, search mock data for the current stream.
        const { streams } = mockStreams;
        const currentStream = streams.filter(stream => stream.username === username);
        this.setState({
          currentStream: currentStream[0],
          avatar: currentStream[0]["avatar"],
          gotStreams: true
        });
      } else {
        // If using real data, fetch streams using the API
        this.getAndSetStreamInfo(username);
      }
    }
  }

  componentWillUnmount() {
    this.stopTick();
    this.stopStreamTimeout();
  }

  getAndSetStreamInfo = (username) => {
    this.getCurrentStreamInfo(username)
      .then((currentStream) => {
        if (currentStream[0].isLive === "No") {
          // If we're not live, get the stream info again after a short timeout
          console.log(`USERNAME: ${username}`);
          this.streamTimeout = setTimeout(() => {
            this.getAndSetStreamInfo(username);
          }, 5000);
        }
        this.setState({
          currentStream: currentStream[0],
          avatar: currentStream[0]["avatar"],
          gotStreams: true
        });
      });
  }

  async getCurrentStreamInfo(username) {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}`;

      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        const streams = json;
        const currentStream = streams.filter(stream => stream.username === username);
        return currentStream;
      } else {
        throw new Error('Unable to get live streams.')
      }
    } catch(error) {
      console.log(error.message);
    }
  }

  handleKeyDown = (e) => {
    if (e.keyCode === 27) { // keyCode 27 is Escape key
      if(this.state.showMessage) {
        this.setState({ showMessage: false });
      }
    }
  }

  handleMyStreamTitleChange = (e) => {
    this.setState({ myStreamTitle: e.target.value });
  }

  handleMyStreamTitleClick = (e) => {
    const myStreamTitle = { "defaultChannelName": this.state.myStreamTitle };
    this.props.changeAttribute(this.props.auth, 'Stream Title', 'profile', myStreamTitle);
  }

  handleStreamTitleKeyDown = (e, streamTitle) => {
    if (e.keyCode === 13 && streamTitle) { // keyCode 13 is carriage return
      const myStreamTitle = { "defaultChannelName": streamTitle };
      this.props.changeAttribute(this.props.auth, 'Stream Title', 'profile', myStreamTitle);
    }
  }

  startTick = () => {
    this.stopTick();
    this.intervalID = setInterval(() => this.tick(), 6000);
  }

  stopTick = () => {
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
  }

  tick() {
    const { currentStream } = this.state;

    let elapsedStreaming = '';
    if (config.USE_MOCK_DATA) {
      elapsedStreaming = ' For 17m';
    }
    else if (Object.keys(currentStream).length && Object.keys(currentStream.channelStatus).length) {
      // To calculate the time difference of two dates
      const startDate = new Date(currentStream.channelStatus.startTime);
      const currentDate = new Date();
      const diffInSec = Math.floor((currentDate.getTime() - startDate.getTime()) / 1000);
      const diffInMin = Math.floor(diffInSec / 60); // in minutes
      const hr = Math.floor(diffInMin / 60);
      const min = diffInMin - (hr * 60);
      elapsedStreaming = hr ? ` For ${hr}h ${min}m` : ` For ${min}m`;
    }

    this.setState({ elapsedStreaming });
  }

  stopStreamTimeout = () => {
    if (this.streamTimeout) {
      clearInterval(this.streamTimeout)
    }
  }

  render() {
    const {
      avatar,
      streamId,
      myStreamTitle,
      currentStream,
      elapsedStreaming,
      gotStreams
    } = this.state;

    const {
      userInfo,
      signedIn,
      checkedAuth
    } = this.props;

    // Set channel avatar
    const channelAvatarUrl = util.getAvatarUrl(avatar);

    // Build video playback URL (should be a URL to a .m3u8 file)
    let videoStream = '';
    if (config.USE_MOCK_DATA) {
      videoStream = config.DEFAULT_VIDEO_STREAM;
    } else if (streamId && Object.keys(currentStream).length) {
      videoStream = Object.keys(currentStream.channel).length ? currentStream.channel.channel.playbackUrl : '';
    }

    // Check if stream is live
    const isLive = (streamId && currentStream) ? currentStream.isLive === 'Yes' : false;
    const isLiveStreaming = (videoStream && isLive) ? true : false;

    // Begin timer tick if stream is live
    if (isLiveStreaming) {
      this.startTick();
      if (!elapsedStreaming) {
        this.tick();
      }
    } else {
      this.stopTick();
    }

    // Validate user info and check if current channel belongs to user
    const userInfoValid = Object.keys(userInfo).length ? true : false;
    let isMyChannel = signedIn && (streamId === userInfo["preferred_username"]);

    if (!isMyChannel && userInfoValid) {
      if (userInfo.preferred_username === currentStream.username || this.props.channelUser === userInfo.preferred_username) {
        isMyChannel = true;
      }
    };

    // Set the title of the current stream
    let currentStreamTitle = myStreamTitle;
    // If the stream title is not set, display the default title.
    if (currentStreamTitle === undefined && userInfoValid) {
      currentStreamTitle = userInfo.profile.defaultChannelName || userInfo.profile.defaultChannelDetails.channel.name;
    }
    const saveStreamTitleDisabled = !currentStreamTitle;

    // Compose player component
    let videoPlayerComponent = (
      <div></div>
    );

    if (gotStreams) {
      if (isLiveStreaming) {
        videoPlayerComponent = (<VideoPlayer videoStream={videoStream} />);
      } else {
        if (checkedAuth) {
          videoPlayerComponent = (<HowToStream handleSettings={this.handleSettings} isMyChannel={isMyChannel} />);
        }
      }
    }

    // Compose title component
    let titleComponent = (<div></div>);
    if (gotStreams) {
      if (isMyChannel) {
        titleComponent = (
          <React.Fragment>
            <fieldset>
              <div className="stream-title-field">
                <input
                  type="text"
                  placeholder="Stream Title"
                  className="pd-t-1 stream-title-input"
                  value={currentStreamTitle}
                  onKeyDown={(e) => this.handleStreamTitleKeyDown(e, currentStreamTitle)}
                  onChange={this.handleMyStreamTitleChange}
                />
                <button className="stream-title-button" disabled={saveStreamTitleDisabled} onClick={this.handleMyStreamTitleClick}>Save</button>
              </div>
            </fieldset>
          </React.Fragment>
        );
      } else {
        titleComponent = (<h4>{currentStream.channelName}</h4>);
      }
    }

    // Compose live indicator component
    let liveIndicatorComponent = (
      <div><span></span></div>
    );
    if (gotStreams) {
      if (isLive) {
        liveIndicatorComponent = (
          <div className="channel-live">
            <span>LIVE</span>{elapsedStreaming}
          </div>
        );
      } else {
        liveIndicatorComponent = (
          <div className="channel-offline">
            <span>OFFLINE</span>
          </div>
        );
      }
    }

    // Compose user meta components
    let userMetaComponent = (<div></div>);
    if (gotStreams) {
      userMetaComponent = (
        <React.Fragment>
          <img className="channel-meta-avatar" src={channelAvatarUrl} alt={currentStream.id} />
          <div className="channel-meta-text">
            <div className="channel-meta-name">{streamId}</div>
            {liveIndicatorComponent}
          </div>
        </React.Fragment>
      );
    }

    return(
      <React.Fragment>
        <div className="main stream-container">
          <div className="content-wrapper mg-2">
            {videoPlayerComponent}
            <div className="stream-title mg-t-1">
              {titleComponent}
              <div className="channel-meta pd-t-1">
                {userMetaComponent}
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

Channel.propTypes = {
  auth: PropTypes.object,
  checkedAuth: PropTypes.bool,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  changeAttribute: PropTypes.func,
  userInfo: PropTypes.object,
  username: PropTypes.string,
  signedIn: PropTypes.bool
}

export default withRouter(Channel);
