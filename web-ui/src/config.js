// Enabling USE_MOCK_DATA will not required a serverless Backend (see ugc-web\serverless\README.md)
export const USE_MOCK_DATA = false;

// Default video stream to play inside the video player
export const DEFAULT_VIDEO_STREAM =
  "https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8";

// API endpoint for retrieving the stream list, signin, signup, getUsers, etc
export const UGC_API = "";

// UGC path, defaults to "/"
export const UGC_PATH = "/";

// Includes showing offline streams on homepage, defaults to false
export const SHOW_OFFLINE_STREAMS = false;

// IVS Channel type, which determines the allowable resolution and bitrate: STANDARD (default) or BASIC
export const IVS_CHANNEL_TYPE = "STANDARD";

// IVS Channel latency mode: NORMAL or LOW (default)
export const IVS_LATENCY_MODE = "LOW";
