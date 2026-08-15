import extensionApi from './extensionApi';
import { createVideoStorage } from './videoStorage';
import {
    getYouTubeVideoId,
    isExpectedPageWaitError,
    isResumableYouTubeUrl,
    queryFirst,
    waitForElement,
    waitForVideoMetadata,
    YOUTUBE_SELECTORS
} from './youtubePage';

const DEBUG = false;
const PLAYER_ICON_ACTIVE = extensionApi.runtime.getURL("icons/playericon.svg");
const PLAYER_ICON_INACTIVE = extensionApi.runtime.getURL("icons/playericon_inactive.svg");
const PROGRESS_WRITE_INTERVAL_MS = 5000;
const PAGE_WAIT_TIMEOUT_MS = 10000;
const videoStorage = createVideoStorage(extensionApi.storage.local);

let userSettings = {};
let blacklist = false;

class YouTubeAutoResume {
    constructor() {
        this.initialized = false;
        this.pageRunController = null;
        this.activeVideo = null;
        this.activeVideoLink = null;
        this.activeVideoTitle = null;
        this.activeVideoChannel = null;
        this.activeVideoTime = 0;
        this.activeVideoDuration = 0;
        this.timeUpdateHandler = null;
        this.pauseHandler = null;
        this.endedHandler = null;
        this.pageHideHandler = null;
        this.lastProgressWriteAt = 0;
        this.writeQueue = Promise.resolve();
        window.addEventListener('load', this.initialize.bind(this));
    }

    async initialize() {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        await this.initStorage();
        userSettings = await this.getUserSettings();
        DEBUG && this.logUserSettings();
        this.setupEventListeners();

        if (!userSettings.pauseResume) {
            await this.runMainVideoProcess();
        }
    }

    logUserSettings() {
        console.log("CHECK PAUSED SETTING: " + userSettings.pauseResume);
        console.log("CHECK MIN WATCH TIME SETTING: " + userSettings.minWatchTime);
        console.log("CHECK MIN VID LENGTH SETTING: " + userSettings.minVideoLength);
    }

    setupEventListeners() {
        this.setupNavigationListener();
        this.setupSettingsListener();
        window.addEventListener('yt-title-change', this.handleTitleChange.bind(this));
    }

    setupNavigationListener() {
        document.addEventListener('yt-navigate-finish', () => {
            DEBUG && console.log("yt-navigate-finish EVENT DETECTED.");
            if (userSettings.pauseResume) {
                this.cancelPageRun();
                this.stopMonitoring({ flush: true }).catch(error => {
                    console.error("Unable to save progress while leaving the video:", error);
                });
                this.removePlayerButton();
                return;
            }
            this.runMainVideoProcess();
        });
    }

    handleTitleChange(event) {
        const newTitle = event.detail?.title;
        if (userSettings.pauseResume || !newTitle) {
            return;
        }
        DEBUG && console.log("Title changed to: " + newTitle);
        this.runMainVideoProcess(newTitle);
    }

    setupSettingsListener() {
        extensionApi.storage.onChanged.addListener(async (changes, areaName) => {
            if (areaName !== "local" || !changes.settings || !changes.settings.newValue) {
                return;
            }

            const wasPaused = userSettings.pauseResume;
            userSettings = { ...userSettings, ...changes.settings.newValue };

            if (!wasPaused && userSettings.pauseResume) {
                this.cancelPageRun();
                await this.stopMonitoring({ flush: true });
                this.removePlayerButton();
                return;
            }

            if (wasPaused && !userSettings.pauseResume) {
                await this.runMainVideoProcess();
            }
        });
    }

    cancelPageRun() {
        this.pageRunController?.abort();
        this.pageRunController = null;
    }

    dispatchTitleChangeEvent(newTitle) {
        const event = new CustomEvent('yt-title-change', { detail: { title: newTitle } });
        window.dispatchEvent(event);
    }

    async ensurePlayerButton(link, signal) {
        const blacklisted = await this.checkBlacklist(link);
        if (signal.aborted) {
            return null;
        }
        let button = document.querySelector("#YTAutoResumePlayerSwitch");
        if (button) {
            this.updatePlayerButtonState(button, blacklisted);
            return button;
        }

        const controls = await waitForElement(YOUTUBE_SELECTORS.playerControls, {
            signal,
            timeoutMs: PAGE_WAIT_TIMEOUT_MS
        });
        if (signal.aborted) {
            return null;
        }
        button = document.querySelector("#YTAutoResumePlayerSwitch");
        if (!button) {
            const imgSrc = blacklisted ? PLAYER_ICON_INACTIVE : PLAYER_ICON_ACTIVE;
            const tooltip = blacklisted ? "Video will not auto-resume" : "Video will auto-resume";
            button = this.createPlayerButton(imgSrc, tooltip, blacklisted);
            controls.prepend(button);
        }
        return button;
    }

    createPlayerButton(imgSrc, tooltip, blacklisted) {
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("ytp-button", "YTAutoResume");
        button.id = "YTAutoResumePlayerSwitch";
        button.title = tooltip;
        button.setAttribute("aria-label", tooltip);
        button.setAttribute("aria-pressed", String(blacklisted));
        button.style.verticalAlign = "top";
        button.onclick = this.onPlayerButtonClick.bind(this);

        const imgElement = document.createElement("img");
        imgElement.id = "YTAutoResumeSwitchIcon";
        imgElement.src = imgSrc;
        imgElement.alt = "";
        imgElement.style.height = "90%";
        imgElement.style.display = "block";
        imgElement.style.margin = "auto";
        button.appendChild(imgElement);

        return button;
    }

    removePlayerButton() {
        document.querySelector("#YTAutoResumePlayerSwitch")?.remove();
    }

    async onPlayerButtonClick() {
        const video = this.activeVideo || queryFirst(YOUTUBE_SELECTORS.video);
        const switchButton = document.querySelector("#YTAutoResumePlayerSwitch");
        if (!video || !switchButton || !Number.isFinite(video.duration)) {
            return;
        }

        const titleElement = queryFirst(YOUTUBE_SELECTORS.title);
        const channelElement = queryFirst(YOUTUBE_SELECTORS.channel);
        const title = this.activeVideoTitle || titleElement?.textContent?.trim() || "YouTube video";
        const channel = this.activeVideoChannel || channelElement?.textContent?.trim() || "";
        const currentlyBlacklisted = switchButton.getAttribute("aria-pressed") === "true";
        const nextBlacklisted = !currentlyBlacklisted;
        const markPlayed = video.duration - video.currentTime < userSettings.markPlayedTime;

        await this.togglePlayerButtonState(nextBlacklisted, markPlayed, video, {
            link: this.activeVideoLink || window.location.href,
            title,
            channel
        });
    }

    updatePlayerButtonState(button, blacklisted) {
        const switchIcon = button.querySelector("#YTAutoResumeSwitchIcon");
        const tooltip = blacklisted ? "Video will not auto-resume" : "Video will auto-resume";

        button.title = tooltip;
        button.setAttribute("aria-label", tooltip);
        button.setAttribute("aria-pressed", String(blacklisted));
        if (switchIcon) {
            switchIcon.src = blacklisted ? PLAYER_ICON_INACTIVE : PLAYER_ICON_ACTIVE;
        }
    }

    async togglePlayerButtonState(blacklisted, markPlayed, video, metadata) {
        const switchButton = document.querySelector("#YTAutoResumePlayerSwitch");
        if (!switchButton) {
            return;
        }

        blacklist = blacklisted;
        this.updatePlayerButtonState(switchButton, blacklisted);

        await this.queueVideoWrite({
            videolink: metadata.link,
            time: video.currentTime,
            duration: video.duration,
            title: metadata.title,
            channel: metadata.channel,
            complete: markPlayed,
            doNotResume: blacklisted
        });

        DEBUG && console.log(`Video ${blacklisted ? 'blacklisted' : 'removed from blacklist'} successfully`);
    }

    async getUserSettings() {
        const data = await extensionApi.storage.local.get("settings");
        return data.settings;
    }

    initStorage() {
        return Promise.all([videoStorage.initialize(), this.initSettings()]);
    }

    async initSettings() {
        const data = await extensionApi.storage.local.get("settings");
        if (!data.settings) {
            await extensionApi.storage.local.set({
                settings: {
                    pauseResume: false,
                    minWatchTime: 60,
                    minVideoLength: 480,
                    markPlayedTime: 60,
                    deleteAfter: 30
                }
            });
        }
    }

    async checkBlacklist(link) {
        const video = await videoStorage.getVideo(link);
        return Boolean(video && video.doNotResume);
    }

    setTime(video) {
        return videoStorage.saveVideo(video);
    }

    queueVideoWrite(video) {
        this.writeQueue = this.writeQueue
            .then(() => this.setTime(video))
            .catch(error => {
                console.error("Unable to save video progress:", error);
            });
        return this.writeQueue;
    }

    async runMainVideoProcess(newTitle = null) {
        this.cancelPageRun();
        const controller = new AbortController();
        this.pageRunController = controller;

        try {
            await this.stopMonitoring({ flush: true });
            if (controller.signal.aborted) {
                return;
            }

            const pageIsActive = await this.mainVideoProcess(newTitle, controller.signal);
            if (!pageIsActive && this.pageRunController === controller) {
                controller.abort();
                this.pageRunController = null;
            }
        } catch (error) {
            controller.abort();
            if (this.pageRunController === controller) {
                this.pageRunController = null;
            }
            if (!isExpectedPageWaitError(error)) {
                console.error("Unable to initialize YouTube Easy Resume on this page:", error);
            }
        }
    }

    async getOptionalElement(selectors, signal) {
        try {
            return await waitForElement(selectors, {
                signal,
                timeoutMs: PAGE_WAIT_TIMEOUT_MS
            });
        } catch (error) {
            if (error?.name === "TimeoutError") {
                return null;
            }
            throw error;
        }
    }

    async mainVideoProcess(newTitle, signal) {
        DEBUG && console.log("Starting mainVideoProcess");
        const pageLink = window.location.href;
        if (!isResumableYouTubeUrl(pageLink)) {
            this.removePlayerButton();
            return false;
        }

        this.ensurePlayerButton(pageLink, signal).catch(error => {
            if (!isExpectedPageWaitError(error)) {
                console.error("Unable to add the player control:", error);
            }
        });

        const videoPromise = waitForElement(YOUTUBE_SELECTORS.video, {
            signal,
            timeoutMs: PAGE_WAIT_TIMEOUT_MS
        }).then(video => waitForVideoMetadata(video, {
            signal,
            timeoutMs: PAGE_WAIT_TIMEOUT_MS
        }));
        const titlePromise = newTitle
            ? Promise.resolve(null)
            : this.getOptionalElement(YOUTUBE_SELECTORS.title, signal);
        const channelPromise = this.getOptionalElement(YOUTUBE_SELECTORS.channel, signal);
        const [video, titleElement, channelElement] = await Promise.all([
            videoPromise,
            titlePromise,
            channelPromise
        ]);

        if (!this.isCurrentPage(pageLink, signal)) {
            return false;
        }
        if (!this.checkDuration(video)) {
            DEBUG && console.log("Video does not meet duration requirements");
            return true;
        }

        const documentTitle = document.title.replace(/\s*-\s*YouTube\s*$/, "").trim();
        const videoTitle = newTitle?.trim()
            || titleElement?.textContent?.trim()
            || documentTitle
            || "YouTube video";
        const channel = channelElement?.textContent?.trim() || "";

        try {
            DEBUG && console.log("Attempting to set video time");
            const storedVideo = await this.checkStoredLinks(pageLink);
            if (storedVideo.time > userSettings.minWatchTime && !storedVideo.complete && !storedVideo.doNotResume) {
                video.currentTime = storedVideo.time;
            }
            blacklist = storedVideo.doNotResume;
        } catch {
            blacklist = false;
        }
        if (!this.isCurrentPage(pageLink, signal)) {
            return false;
        }

        this.monitorVideoTime(video, videoTitle, channel, pageLink);
        return true;
    }

    isCurrentPage(link, signal) {
        return !signal.aborted
            && isResumableYouTubeUrl(window.location.href)
            && getYouTubeVideoId(window.location.href) === getYouTubeVideoId(link);
    }

    checkDuration(video) {
        return Number.isFinite(video.duration) && video.duration >= userSettings.minVideoLength;
    }

    async checkStoredLinks(link) {
        const video = await videoStorage.getVideo(link);
        if (!video) {
            throw new Error("Video not found");
        }
        if (videoStorage.isExpired(video, userSettings.deleteAfter)) {
            await videoStorage.removeVideo(video);
            throw new Error("Video expired");
        }
        return video;
    }

    monitorVideoTime(video, videoTitle, channel, link) {
        this.activeVideo = video;
        this.activeVideoLink = link;
        this.activeVideoTitle = videoTitle;
        this.activeVideoChannel = channel;
        this.captureCurrentProgress();
        this.lastProgressWriteAt = 0;
        let lastTitle = videoTitle;
        DEBUG && console.log("Starting video time monitoring for " + lastTitle);

        this.timeUpdateHandler = () => {
            this.captureCurrentProgress();
            const titleElement = queryFirst(YOUTUBE_SELECTORS.title);
            const currentTitle = titleElement?.textContent?.trim() || lastTitle;
            DEBUG && console.log("Monitoring video time for " + currentTitle);

            if (currentTitle !== lastTitle) {
                DEBUG && console.log("New title detected: " + currentTitle);
                lastTitle = currentTitle;
                this.dispatchTitleChangeEvent(currentTitle);
                return;
            }

            this.persistCurrentVideo();
        };

        this.pauseHandler = () => {
            this.captureCurrentProgress();
            this.persistCurrentVideo({ force: true });
        };
        this.endedHandler = () => {
            this.captureCurrentProgress();
            this.persistCurrentVideo({ force: true });
        };
        this.pageHideHandler = () => {
            this.captureCurrentProgress();
            this.persistCurrentVideo({ force: true });
        };

        video.addEventListener('timeupdate', this.timeUpdateHandler);
        video.addEventListener('pause', this.pauseHandler);
        video.addEventListener('ended', this.endedHandler);
        window.addEventListener('pagehide', this.pageHideHandler);
    }

    captureCurrentProgress() {
        if (!this.activeVideo) {
            return;
        }
        this.activeVideoTime = this.activeVideo.currentTime;
        this.activeVideoDuration = this.activeVideo.duration;
    }

    persistCurrentVideo({ force = false } = {}) {
        const videoRecord = this.getActiveVideoRecord();
        if (!videoRecord) {
            return this.writeQueue;
        }

        const now = Date.now();
        if (!force && this.lastProgressWriteAt !== 0 && now - this.lastProgressWriteAt < PROGRESS_WRITE_INTERVAL_MS) {
            return this.writeQueue;
        }
        this.lastProgressWriteAt = now;
        return this.queueVideoWrite(videoRecord);
    }

    getActiveVideoRecord() {
        if (!this.activeVideo || blacklist) {
            return null;
        }

        return {
            videolink: this.activeVideoLink,
            time: this.activeVideoTime,
            duration: this.activeVideoDuration,
            title: this.activeVideoTitle,
            channel: this.activeVideoChannel,
            complete: this.activeVideoDuration - this.activeVideoTime < userSettings.markPlayedTime,
            doNotResume: false
        };
    }

    async stopMonitoring({ flush = false } = {}) {
        const videoRecord = flush ? this.getActiveVideoRecord() : null;

        if (this.activeVideo) {
            this.activeVideo.removeEventListener('timeupdate', this.timeUpdateHandler);
            this.activeVideo.removeEventListener('pause', this.pauseHandler);
            this.activeVideo.removeEventListener('ended', this.endedHandler);
        }
        if (this.pageHideHandler) {
            window.removeEventListener('pagehide', this.pageHideHandler);
        }

        this.activeVideo = null;
        this.activeVideoLink = null;
        this.activeVideoTitle = null;
        this.activeVideoChannel = null;
        this.activeVideoTime = 0;
        this.activeVideoDuration = 0;
        this.timeUpdateHandler = null;
        this.pauseHandler = null;
        this.endedHandler = null;
        this.pageHideHandler = null;
        this.lastProgressWriteAt = 0;

        if (videoRecord) {
            await this.queueVideoWrite(videoRecord);
        } else {
            await this.writeQueue;
        }
    }
}

new YouTubeAutoResume();
