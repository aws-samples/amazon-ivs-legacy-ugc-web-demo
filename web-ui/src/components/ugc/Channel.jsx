import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import * as config from "../../config";
import * as util from "../util";

// Components
import VideoPlayer from "../videoPlayer/VideoPlayer";
import HowToStream from "./HowToStream";

// Mock data
import { mockStreams } from "../../__test__/mocks/streams-mocks";

const Channel = (props) => {
  const [streamId, setStreamId] = useState("");
  const [elapsedStreaming, setElapsedStreaming] = useState("");
  const [streamData, setStreamData] = useState({
    currentStream: {},
    gotStreams: false,
    avatar: "",
  });
  const [showMessage, setShowMessage] = useState(false);
  const [myStreamTitle, setMyStreamTitle] = useState("");

  let intervalID = useRef(null);
  let streamTimeoutID = useRef(null);

  const handleKeyDown = (e) => {
    if (e.keyCode === 27) {
      // keyCode 27 is Escape key
      if (showMessage) {
        setShowMessage(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    // Get current channel's username from the URL params
    const username = props.match.params.user;

    // Set the streamId to the current channel's username
    setStreamId(username);

    // Set the currentStream object to the correct stream
    if (config.USE_MOCK_DATA) {
      // If using mock data, search mock data for the current stream.
      const { streams } = mockStreams;
      const currentS = streams.filter((stream) => stream.username === username);
      setMultipleStates(currentS);
    } else {
      // If using real data, fetch streams using the API
      getAndSetStreamInfo(username);
    }
    return () => {
      stopTick();
      stopStreamTimeout();
    };
  }, []);

  const setMultipleStates = (currentSt) => {
    setStreamData({
      currentStream: currentSt[0],
      avatar: currentSt[0]["avatar"],
      gotStreams: true,
    });
  };

  useEffect(() => {
    stopStreamTimeout();

    const username = props.match.params.user;

    // Set the streamId to the current channel's username
    setStreamId(username);

    // Set the currentStream object to the correct stream
    if (config.USE_MOCK_DATA) {
      // If using mock data, search mock data for the current stream.
      const { streams } = mockStreams;
      const currentS = streams.filter((stream) => stream.username === username);

      setMultipleStates(currentS);
    } else {
      // If using real data, fetch streams using the API
      getAndSetStreamInfo(username);
    }
  }, [props.match.params.user]);

  const getAndSetStreamInfo = async (username) => {
    getCurrentStreamInfo(username)
      .then((currentS) => {
        setMultipleStates(currentS);
        if (currentS[0].isLive === "No") {
          // If we're not live, get the stream info again after a short timeout
          console.log(`USERNAME: ${username}`);
          streamTimeoutID.current = setTimeout(() => {
            getAndSetStreamInfo(username);
          }, 5000);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getCurrentStreamInfo = async (username) => {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}`;

      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        const streams = json;
        const currentStream = streams.filter(
          (stream) => stream.username === username
        );
        return currentStream;
      } else {
        throw new Error("Unable to get live streams.");
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleMyStreamTitleChange = (e) => {
    setMyStreamTitle(e.target.value);
  };

  const handleMyStreamTitleClick = (e) => {
    const myStreamTitleObj = { defaultChannelName: myStreamTitle };
    props.changeAttribute(
      props.auth,
      "Stream Title",
      "profile",
      myStreamTitleObj
    );
  };

  const handleStreamTitleKeyDown = (e, streamTitle) => {
    if (e.keyCode === 13 && streamTitle) {
      // keyCode 13 is carriage return
      const myStreamTitle = { defaultChannelName: streamTitle };
      props.changeAttribute(
        props.auth,
        "Stream Title",
        "profile",
        myStreamTitle
      );
    }
  };

  const startTick = () => {
    stopTick();
    intervalID.current = setInterval(() => tick(), 6000);
  };

  const stopTick = () => {
    clearInterval(intervalID.current);
  };

  const tick = () => {
    let elapsedStreamingStr = "";
    if (config.USE_MOCK_DATA) {
      elapsedStreamingStr = " For 17m";
    } else if (
      Object.keys(streamData.currentStream).length &&
      Object.keys(streamData.currentStream.channelStatus).length
    ) {
      // To calculate the time difference of two dates
      const startDate = new Date(
        streamData.currentStream.channelStatus.startTime
      );
      const currentDate = new Date();
      const diffInSec = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / 1000
      );
      const diffInMin = Math.floor(diffInSec / 60); // in minutes
      const hr = Math.floor(diffInMin / 60);
      const min = diffInMin - hr * 60;
      elapsedStreamingStr = hr ? ` For ${hr}h ${min}m` : ` For ${min}m`;
    }

    setElapsedStreaming(elapsedStreamingStr);
  };

  const stopStreamTimeout = () => {
    clearInterval(streamTimeoutID.current);
  };

  const { userInfo, signedIn, checkedAuth } = props;

  // Set channel avatar
  const channelAvatarUrl = util.getAvatarUrl(streamData.avatar);

  // Build video playback URL (should be a URL to a .m3u8 file)
  let videoStream = "";
  if (config.USE_MOCK_DATA) {
    videoStream = config.DEFAULT_VIDEO_STREAM;
  } else if (streamId && Object.keys(streamData.currentStream).length) {
    videoStream = Object.keys(streamData.currentStream.channel).length
      ? streamData.currentStream.channel.channel.playbackUrl
      : "";
  }

  // Check if stream is live
  const isLive =
    streamId && streamData.currentStream
      ? streamData.currentStream.isLive === "Yes"
      : false;
  const isLiveStreaming = videoStream && isLive ? true : false;

  // Begin timer tick if stream is live
  if (isLiveStreaming) {
    startTick();
    if (!elapsedStreaming) {
      tick();
    }
  } else {
    stopTick();
  }

  // Validate user info and check if current channel belongs to user
  const userInfoValid = Object.keys(userInfo).length ? true : false;
  let isMyChannel = signedIn && streamId === userInfo["preferred_username"];

  if (!isMyChannel && userInfoValid) {
    if (
      userInfo.preferred_username === streamData.currentStream.username ||
      props.channelUser === userInfo.preferred_username
    ) {
      isMyChannel = true;
    }
  }

  // Set the title of the current stream
  let currentStreamTitle = myStreamTitle;
  // If the stream title is not set, display the default title.
  if (!currentStreamTitle && userInfoValid) {
    currentStreamTitle =
      userInfo.profile.defaultChannelName ||
      userInfo.profile.defaultChannelDetails.channel.name;
  }
  const saveStreamTitleDisabled = !currentStreamTitle;

  // Compose player component
  let videoPlayerComponent = <div></div>;

  if (streamData.gotStreams) {
    if (isLiveStreaming) {
      videoPlayerComponent = <VideoPlayer videoStream={videoStream} />;
    } else {
      if (checkedAuth) {
        videoPlayerComponent = <HowToStream isMyChannel={isMyChannel} />;
      }
    }
  }

  // Compose title component
  let titleComponent = <div></div>;
  if (streamData.gotStreams) {
    if (isMyChannel) {
      titleComponent = (
        <>
          <fieldset>
            <div className="stream-title-field">
              <input
                type="text"
                placeholder="Stream Title"
                className="pd-t-1 stream-title-input"
                value={currentStreamTitle}
                onKeyDown={(e) =>
                  handleStreamTitleKeyDown(e, currentStreamTitle)
                }
                onChange={handleMyStreamTitleChange}
              />
              <button
                className="stream-title-button"
                disabled={saveStreamTitleDisabled}
                onClick={handleMyStreamTitleClick}
              >
                Save
              </button>
            </div>
          </fieldset>
        </>
      );
    } else {
      titleComponent = <h4>{streamData.currentStream.channelName}</h4>;
    }
  }

  return (
    <div className="main stream-container">
      <div className="content-wrapper mg-2">
        {videoPlayerComponent}
        <div className="stream-title mg-t-1">
          {titleComponent}
          <div className="channel-meta pd-t-1">
            {streamData.gotStreams && (
              <>
                <img
                  className="channel-meta-avatar"
                  src={channelAvatarUrl}
                  alt={streamData.currentStream.id}
                />
                <div className="channel-meta-text">
                  <div className="channel-meta-name">{streamId}</div>
                  {isLive ? (
                    <div className="channel-live">
                      <span>LIVE</span>
                      {elapsedStreaming}
                    </div>
                  ) : (
                    <div className="channel-offline">
                      <span>OFFLINE</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Channel.propTypes = {
  auth: PropTypes.object,
  checkedAuth: PropTypes.bool,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  changeAttribute: PropTypes.func,
  userInfo: PropTypes.object,
  username: PropTypes.string,
  signedIn: PropTypes.bool,
  match: PropTypes.object,
  channelUser: PropTypes.string,
};

export default withRouter(Channel);
