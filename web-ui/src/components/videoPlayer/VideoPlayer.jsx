import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

// Styles
import "./VideoPlayer.css";

const VideoPlayer = ({ videoStream }) => {
  const playerRef = useRef(null);

  useEffect(() => {
    initVideo();
    return () => {
      destroyVideo();
    };
  }, []);

  useEffect(() => {
    if (!!videoStream) {
      playerRef.current.src(videoStream);
    }
  }, [videoStream]);

  const destroyVideo = () => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };

  const initVideo = () => {
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
        pictureInPictureToggle: false,
      },
    };

    // instantiate video.js
    const player = videojs("amazon-ivs-videojs", videoJsOptions);
    playerRef.current = player;
    playerRef.current.ready(handlePlayerReady);
  };

  const handlePlayerReady = () => {
    playerRef.current.enableIVSQualityPlugin();
    playerRef.current.src(videoStream);
    playerRef.current.play();
  };

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
};

VideoPlayer.propTypes = {
  videoStream: PropTypes.string,
};

export default VideoPlayer;
