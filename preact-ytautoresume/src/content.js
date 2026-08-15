// content.js

import extensionApi from './extensionApi';
import { createVideoStorage } from './videoStorage';

const DEBUG = false;
const CHANNEL_SELECTOR = "ytd-video-owner-renderer ytd-channel-name a";
const PLAYER_ICON_ACTIVE = extensionApi.runtime.getURL("icons/playericon.svg");
const PLAYER_ICON_INACTIVE = extensionApi.runtime.getURL("icons/playericon_inactive.svg");
const PROGRESS_WRITE_INTERVAL_MS = 5000;
const videoStorage = createVideoStorage(extensionApi.storage.local);

let initialLinkIsVideo = false;
let userSettings = {};
let blacklist = false;

class YouTubeAutoResume {
    constructor() {
        this.initialized = false;
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
            initialLinkIsVideo = this.checkWatchable(window.location.href);

            if (initialLinkIsVideo) {
                await this.injectPlayerButton();
            }

            if (initialLinkIsVideo) {
                this.runMainVideoProcess();
            }
        } else {
            DEBUG && console.log("paused");
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
        document.addEventListener('yt-navigate-finish', async () => {
            DEBUG && console.log("yt-navigate-finish EVENT DETECTED.");
            await this.stopMonitoring({ flush: true });
            if (userSettings.pauseResume) {
                return;
            }
            initialLinkIsVideo = false;
            await this.resetButton();
            await this.runMainVideoProcess();
        });
    }

    handleTitleChange(event) {
        if (userSettings.pauseResume) {
            return;
        }
        const newTitle = event.detail.title;
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
                await this.stopMonitoring({ flush: true });
                return;
            }

            if (wasPaused && !userSettings.pauseResume && this.checkWatchable(window.location.href)) {
                await this.resetButton();
                await this.runMainVideoProcess();
            }
        });
    }

    dispatchTitleChangeEvent(newTitle) {
        const event = new CustomEvent('yt-title-change', { detail: { title: newTitle } });
        window.dispatchEvent(event);
    }

    async injectPlayerButton() {
        const blacklisted = await this.checkBlacklist(window.location.href);
        const imgSrc = blacklisted ? PLAYER_ICON_INACTIVE : PLAYER_ICON_ACTIVE;
        const tooltip = blacklisted ? "Video will not auto-resume" : "Video will auto-resume";
        const button = this.createPlayerButton(imgSrc, tooltip, blacklisted);
        document.querySelector("div.ytp-right-controls")?.prepend(button);
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

    async onPlayerButtonClick() {
        const video = document.querySelector("video");
        const switchButton = document.querySelector("#YTAutoResumePlayerSwitch");
        const channel = document.querySelector(CHANNEL_SELECTOR);

        if (!video || !switchButton || !channel) {
            return;
        }

        const title = await this.grabTitle();
        const currentlyBlacklisted = switchButton.getAttribute("aria-pressed") === "true";
        const nextBlacklisted = !currentlyBlacklisted;
        const markPlayed = video.duration - video.currentTime < userSettings.markPlayedTime;

        await this.togglePlayerButtonState(nextBlacklisted, markPlayed, video, {
            title,
            channel: channel.textContent
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
            videolink: window.location.href,
            time: video.currentTime,
            duration: video.duration,
            title: metadata.title,
            channel: metadata.channel,
            complete: markPlayed,
            doNotResume: blacklisted
        });
        
        DEBUG && console.log(`Video ${blacklisted ? 'blacklisted' : 'removed from blacklist'} successfully`);
    }

    async resetButton() {
        const button = document.querySelector("#YTAutoResumePlayerSwitch");
        if (button) {
            const blacklisted = await this.checkBlacklist(window.location.href);
            blacklist = blacklisted;
            this.updatePlayerButtonState(button, blacklisted);
        } else {
            await this.injectPlayerButton();
        }
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

    grabTitle() {
        return new Promise(resolve => {
            let videoTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer");
            if (videoTitle) {
                resolve(videoTitle.textContent);
            } else {
                let interval = setInterval(() => {
                    videoTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer");
                    if (videoTitle) {
                        clearInterval(interval);
                        resolve(videoTitle.textContent);
                    }
                }, 2000);
            }
        });
    }

    checkWatchable(link) {
        return link.includes("watch?") && !link.includes("?t=");
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
            .catch(error => {
                console.error("Unable to save video progress:", error);
            })
            .then(() => this.setTime(video));
        return this.writeQueue;
    }

    async runMainVideoProcess(newTitle = null) {
        await this.mainVideoProcess(newTitle);
    }

    async mainVideoProcess(newTitle = null) {
        DEBUG && console.log("Starting mainVideoProcess");
        await this.stopMonitoring({ flush: true });

        if (!this.checkWatchable(window.location.href) || !this.checkDuration()) {
            DEBUG && console.log("Video not viewable or does not meet duration requirements");
            return;
        }

        const videoTitle = newTitle || await this.grabTitle();

        try {
            DEBUG && console.log("Attempting to set video time");
            const storedVideo = await this.checkStoredLinks(window.location.href);
            if (storedVideo.time > userSettings.minWatchTime && !storedVideo.complete && !storedVideo.doNotResume) {
                document.querySelector("video").currentTime = storedVideo.time;
            }
            blacklist = storedVideo.doNotResume;
        } catch {
            blacklist = false;
        }

        this.monitorVideoTime(videoTitle);
    }

    checkDuration() {
        const video = document.querySelector("video");
        return video.duration >= userSettings.minVideoLength;
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

    monitorVideoTime(videoTitle) {
        const video = document.querySelector("video");
        const channel = document.querySelector(CHANNEL_SELECTOR);
        if (!video || !channel) {
            return;
        }

        this.activeVideo = video;
        this.activeVideoLink = window.location.href;
        this.activeVideoTitle = videoTitle;
        this.activeVideoChannel = channel.textContent;
        this.captureCurrentProgress();
        this.lastProgressWriteAt = 0;
        let lastTitle = videoTitle;
        DEBUG && console.log("Starting video time monitoring for " + lastTitle);
    
        this.timeUpdateHandler = () => {
            this.captureCurrentProgress();
            const titleElement = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer");
            const currentTitle = titleElement ? titleElement.textContent : lastTitle;
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
        if (!this.activeVideo || blacklist) {
            return this.writeQueue;
        }

        const now = Date.now();
        if (!force && this.lastProgressWriteAt !== 0 && now - this.lastProgressWriteAt < PROGRESS_WRITE_INTERVAL_MS) {
            return this.writeQueue;
        }
        this.lastProgressWriteAt = now;

        const markPlayed = this.activeVideoDuration - this.activeVideoTime < userSettings.markPlayedTime;
        return this.queueVideoWrite({
            videolink: this.activeVideoLink,
            time: this.activeVideoTime,
            duration: this.activeVideoDuration,
            title: this.activeVideoTitle,
            channel: this.activeVideoChannel,
            complete: markPlayed,
            doNotResume: false
        });
    }

    async stopMonitoring({ flush = false } = {}) {
        if (flush) {
            await this.persistCurrentVideo({ force: true });
        }

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
    }
}

new YouTubeAutoResume();
