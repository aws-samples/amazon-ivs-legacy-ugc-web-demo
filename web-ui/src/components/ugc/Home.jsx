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
  const [hasFetchedStreams, setHasFetchedStreams] = useState(false);
  const [streams, setStreams] = useState([]);
  const { signedIn, showSignIn, username, currentPath } = props;

  useEffect(() => {
    const getLiveStreams = async () => {
      try {
        const baseUrl = util.getApiUrlBase();
        const auth = util.getWithExpiry("ugc");
        const url = `${baseUrl}${
          config.SHOW_OFFLINE_STREAMS ? "channels" : "live-channels"
        }`;

        const response = await fetch(url);
        if (response.status === 200) {
          const streams = await response.json();

          setStreams(streams);
          setHasFetchedStreams(true);
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
      setHasFetchedStreams(true);
    } else {
      getLiveStreams();
    }
  }, [signedIn]);

  // Check if any streams are live
  const streamsExist = streams.length ? true : false;

  let componentToRender = <div></div>;

  if (hasFetchedStreams) {
    if (streamsExist) {
      componentToRender = <Streams streams={streams} />;
    } else if (!streamsExist) {
      componentToRender = (
        <React.Fragment>
          {!signedIn && (
            <div>
              <h2>Live Streams</h2>
              <div>There are no live streams available.</div>
              <div>
                <Link className="sign-in" to="/signin" onClick={showSignIn}>
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
