import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import * as config from '../../config';
import * as util from '../util';

// Components
import Streams from './Streams';

// Mock data
import { mockStreams } from '../../__test__/mocks/streams-mocks';

class Home extends Component {
  constructor() {
    super();
    this.state = {
      gotStreams: false,
      streams: [],
      streamId: '',
      showOfflineStreams: false,
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);

    this.setState({
      showOfflineStreams: config.SHOW_OFFLINE_STREAMS,
    });

    // Get live streams
    if (config.USE_MOCK_DATA) {
      const { streams } = mockStreams;
      this.setState({ streams, gotStreams: true });
    } else {
      this.getLiveStreams();
    }
  }

  async getLiveStreams() {
    try {
      const baseUrl = util.getApiUrlBase();
      const url = `${baseUrl}`;

      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();

        let streams = json;
        if (!config.SHOW_OFFLINE_STREAMS) {
          streams = streams.filter(stream => stream.isLive === 'Yes');
        }

        this.setState({ streams, gotStreams: true });
      } else {
        throw new Error('Unable to get live streams.')
      }
    } catch(error) {
      console.log(error.message);
    }
  }

  render() {
    const { gotStreams, streams, showOfflineStreams } = this.state;
    const { signedIn, showSignIn, username, currentPath } = this.props

    // Check if any streams are live
    const streamsExist = streams.length ? true : false;

    let componentToRender = (
      <div></div>
    );

    if (gotStreams) {
      if (streamsExist) {
        componentToRender = (
          <Streams
            streams={streams}
            showOfflineStreams={showOfflineStreams}
          />
        );
      } else if (!streamsExist) {
        componentToRender = (
          <React.Fragment>
            {!signedIn && (
              <div>
                <h2>Live Streams</h2>
                <div>There are no live streams available.</div>
                <div><Link className="sign-in" to={`${currentPath}/signin`} onClick={showSignIn}>Sign in</Link> to go live and see your stream here.</div>
              </div>
            )}
            {signedIn && (
              <div>
                <h2>Live Streams</h2>
                <div>There are no live streams available.</div>
                <div>Go to your <Link className="my-channel" to={`channel/${username}`}>Channel</Link> to see how to go live.</div>
              </div>
            )}
          </React.Fragment>
        )
      }
    }

    return(
      <div className="main">
        <div className="content-wrapper mg-2">
          {componentToRender}
        </div>
      </div>
    )
  }
}

Home.propTypes = {
  showSignIn: PropTypes.func,
  username: PropTypes.string,
  currentPath: PropTypes.object,
  signedIn: PropTypes.bool
};

export default Home;
