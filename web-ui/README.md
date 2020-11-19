# Web-UI App Setup

## Prerequisites

- [NodeJS](https://nodejs.org/)
- Npm is installed with Node.js
- Serverless app deployed and set up. Follow the steps in the [serverless app setup](../serverless) to deploy the backend to your AWS account.

## Running the demo

To get the web demo running, follow these instructions:

1. [Install NodeJS](https://nodejs.org/). Download latest LTS version ("Recommended for Most Users")
2. Navigate to the web-ui project directory on your local computer.
   Example: `~/Developer/amazon-vs-ugc-web-demo/web-ui`
3. Run: `npm install`
4. Run: `npm start`
5. Open open this URL in your browser: http://localhost:3000/

## Configuration

The following entry in src/config.js (inside the web-ui project directory) is used to create accounts, signin, modify attributes, etc.

- `USE_MOCK_DATA`

  - Enabling `USE_MOCK_DATA` will not required a serverless Backend (see `serverless/README.md`)
  - Default: `false`

- `DEFAULT_VIDEO_STREAM`

  - Default video stream to play inside the video player when in `USE_MOCK_DATA` mode

- `UGC_API`

  - API endpoint for retrieving the stream list, signin, signup, getUsers, modify attributes, etc

- `UGC_PATH`

  - UGC root path,
  - default: `"/"`

- `SHOW_OFFLINE_STREAMS`

  - Includes offline streams on homepage when not using mock data (`USE_MOCK_DATA = false`)
  - Default: `false`

- `IVS_CHANNEL_TYPE`

  - IVS Channel type, which determines the allowable resolution and bitrate: `STANDARD` or `BASIC`
  - Default: `STANDARD`

- `IVS_LATENCY_MODE`
  - IVS Channel latency mode: `NORMAL` or `LOW`
  - Default: `LOW`

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
