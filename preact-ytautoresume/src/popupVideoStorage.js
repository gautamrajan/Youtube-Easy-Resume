/* global chrome, globalThis */
import './videoStorage';

const videoStorage = globalThis.YouTubeEasyResumeVideoStorage.createVideoStorage(
    chrome.storage.local,
    () => chrome.runtime && chrome.runtime.lastError
);

export default videoStorage;
