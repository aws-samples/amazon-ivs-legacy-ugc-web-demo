import React, { Component } from "react";
import PropTypes from "prop-types";

// Styles
import "./VideoPlayer.css";

class VideoPlayer extends Component {
  componentDidMount() {
    this.initVideo();
  }

  componentDidUpdate(prevProps) {
    // Change player src when props change
    if (this.props.videoStream !== prevProps.videoStream) {
      this.player.src(this.props.videoStream);
    }
  }

  componentWillUnmount() {
    this.destroyVideo();
  }

  destroyVideo() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
  }

  initVideo() {
    // Here, we load videojs, IVS tech, and the IVS quality plugin
    // These must be prefixed with window. because they are loaded to the window context
    // in web-ui/public.
    const videojs = window.videojs,
      registerIVSTech = window.registerIVSTech,
      registerIVSQualityPlugin = window.registerIVSQualityPlugin;

    // Set up IVS playback tech and quality plugin
    registerIVSTech(videojs);
    registerIVSQualityPlugin(videojs);

    const videoJsOptions = {
      techOrder: ["AmazonIVS"],
      autoplay: true,
      muted: false,
      controlBar: {
        'pictureInPictureToggle': false
      }
    };

    // instantiate video.js
    this.player = videojs("amazon-ivs-videojs", videoJsOptions);
    this.player.ready(this.handlePlayerReady);
  }

  handlePlayerReady = () => {
    this.player.enableIVSQualityPlugin();
    this.player.src(this.props.videoStream);
    this.player.play();
  };

  render() {
    return (
      <div className="video-container">
        <video
          id="amazon-ivs-videojs"
          className="video-js vjs-fluid vjs-big-play-centered"
          controls
          autoPlay
          playsInline
        ></video>
      </div>
    );
  }
}

VideoPlayer.propTypes = {
  videoStream: PropTypes.string,
};

export default VideoPlayer;
