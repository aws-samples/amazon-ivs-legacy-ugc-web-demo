import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import * as config from "../../config";
import * as util from "../util";

// Components
import Streams from "./Streams";

// Mock data
import { mockStreams } from "../../__test__/mocks/streams-mocks";

const Home = (props) => {
  const [gotStreams, setGotStreams] = useState(false);
  const [streams, setStreams] = useState([]);
  const [streamId, setStreamId] = useState("");
  const [showOfflineStreams, setShowOfflineStreams] = useState(false);

  useEffect(() => {
    // document.addEventListener("keydown", this.handleKeyDown);
    setShowOfflineStreams(config.SHOW_OFFLINE_STREAMS);
    const getLiveStreams = async () => {
      try {
        const baseUrl = util.getApiUrlBase();
        const url = `${baseUrl}`;

        const response = await fetch(url);
        if (response.status === 200) {
          const json = await response.json();

          let streams = json;
          if (!config.SHOW_OFFLINE_STREAMS) {
            streams = streams.filter((stream) => stream.isLive === "Yes");
          }

          setStreams(streams);
          setGotStreams(true);
        } else {
          throw new Error("Unable to get live streams.");
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    // Get live streams
    if (config.USE_MOCK_DATA) {
      const { streams } = mockStreams;
      setStreams(streams);
      setGotStreams(true);
    } else {
      getLiveStreams();
    }
  }, []);

  const { signedIn, showSignIn, username, currentPath } = props;

  // Check if any streams are live
  const streamsExist = streams.length ? true : false;

  let componentToRender = <div></div>;

  if (gotStreams) {
    if (streamsExist) {
      componentToRender = (
        <Streams streams={streams} showOfflineStreams={showOfflineStreams} />
      );
    } else if (!streamsExist) {
      componentToRender = (
        <React.Fragment>
          {!signedIn && (
            <div>
              <h2>Live Streams</h2>
              <div>There are no live streams available.</div>
              <div>
                <Link
                  className="sign-in"
                  to={`${currentPath}/signin`}
                  onClick={showSignIn}
                >
                  Sign in
                </Link>{" "}
                to go live and see your stream here.
              </div>
            </div>
          )}
          {signedIn && (
            <div>
              <h2>Live Streams</h2>
              <div>There are no live streams available.</div>
              <div>
                Go to your{" "}
                <Link className="my-channel" to={`channel/${username}`}>
                  Channel
                </Link>{" "}
                to see how to go live.
              </div>
            </div>
          )}
        </React.Fragment>
      );
    }
  }

  return (
    <div className="main">
      <div className="content-wrapper mg-2">{componentToRender}</div>
    </div>
  );
};

Home.propTypes = {
  showSignIn: PropTypes.func,
  username: PropTypes.string,
  currentPath: PropTypes.object,
  signedIn: PropTypes.bool,
};

export default Home;
