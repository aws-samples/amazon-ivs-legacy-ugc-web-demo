import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import * as util from "../util";

// Stylesheets
import "./Streams.css";

const Streams = ({ streams, showOfflineStreams }) => {
  const generateStreams = () => {
    return streams.map((stream) => {
      const image = util.getAvatarUrl(stream.avatar);
      const streamUrl = `/channel/${stream.username}`;
      const color = stream.bgColor.toLowerCase();
      return (
        <div
          key={stream.username}
          className="stream-item-wrapper full-width br-all-sm"
        >
          <div
            className={`stream-item aspect-169 pos-relative mg-b-05 bg-${color}`}
          >
            <Link
              to={streamUrl}
              className="stream-item-image-link pos-absolute full-width full-height top-0 left-0 fl fl-center"
            >
              <img className="stream-item__image" src={image} alt={stream.id} />
            </Link>
          </div>
          <Link className="stream-item-link" to={streamUrl}>
            {stream.channelName}
          </Link>
          <div className="stream-username-wrapper">
            <span className="color-hint">{stream.username}</span>
          </div>
        </div>
      );
    });
  };

  const headingText = showOfflineStreams ? "All Channels" : "Live Streams";
  return (
    <div className="pos-relative full-width">
      <div className="mg-b-1">
        <h2>{`${headingText}`}</h2>
      </div>
      <div className="stream-items grid grid--responsive grid--3">
        {generateStreams()}
      </div>
    </div>
  );
};

Streams.propTypes = {
  streams: PropTypes.array,
  showOfflineStreams: PropTypes.bool,
};

export default Streams;
