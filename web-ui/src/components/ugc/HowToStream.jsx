import React, { Component } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import * as util from "../util";

// Styles
import "./HowToStream.css";

const HowToStream = ({ isMyChannel }) => {
  const basePath = util.getBasePath();

  let toRender = (
    <div className="aspect-169 bg-black">
      <div className="fl fl-a-center fl-j-center stream-offline pos-absolute full-width full-height">
        <h2>Stream is offline</h2>
      </div>
    </div>
  );

  if (isMyChannel) {
    toRender = (
      <div className="how-to-stream">
        <div>
          <h2 className="pd-0">How to stream</h2>
          <hr className="mg-y-2" />
          <ol className="pd-0">
            <li className="pd-b-1">
              <span className="numberCircle mg-r-1">1</span>Get your stream key
              and ingest server from the{" "}
              <Link to={`${basePath}settings`} className="link-to-settings">
                settings
              </Link>{" "}
              page.
            </li>
            <li className="pd-b-1">
              <span className="numberCircle mg-r-1">2</span>Enter the stream key
              and injest server into your streaming software.
            </li>
            <li className="pd-b-1">
              <span className="numberCircle mg-r-1">3</span>Go live in your
              streaming software.
            </li>
            <li className="pd-b-1">
              <span className="numberCircle mg-r-1">4</span>Refresh the page to
              see your video.
            </li>
          </ol>
        </div>
      </div>
    );
  }
  return <div className="full-width">{toRender}</div>;
};

HowToStream.propTypes = {
  isMyChannel: PropTypes.bool,
};

export default HowToStream;
