// content.js
import { openDB, getVideos, setVideo, deleteVideo, getSettings, setSettings, migrateData } from './indexedDB.js';

const DEBUG = true;
const CHANNEL_SELECTOR = "ytd-video-owner-renderer ytd-channel-name a";
const PLAYER_ICON_ACTIVE = chrome.runtime.getURL("icons/playericon.svg");
const PLAYER_ICON_INACTIVE = chrome.runtime.getURL("icons/playericon_inactive.svg");

let initialLinkIsVideo = false;
let ytNavLoop = false;
let userSettings = {};
let blacklist = false;

class YouTubeAutoResume {
    constructor() {
        window.addEventListener('load', this.initialize.bind(this));
    }

    async initialize() {
        await this.initStorage();
        userSettings = await this.getUserSettings();
        DEBUG && this.logUserSettings();

        if (!userSettings.pauseResume) {
            ytNavLoop = false;
            initialLinkIsVideo = this.checkWatchable(window.location.href);

            if (initialLinkIsVideo) {
                await this.injectPlayerButton();
            }

            this.setupNavigationListener();

            if (initialLinkIsVideo && !ytNavLoop) {
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

    setupNavigationListener() {
        document.addEventListener('yt-navigate-finish', async () => {
            DEBUG && console.log("yt-navigate-finish EVENT DETECTED.");
            if (initialLinkIsVideo) {
                initialLinkIsVideo = false;
                await this.resetButton();
                this.runMainVideoProcess();
            } else {
                await this.resetButton();
                this.runMainVideoProcess();
                ytNavLoop = true;
            }
        });
    }

    async injectPlayerButton() {
        let blacklisted = await this.checkBlacklist(window.location.href);
        let imgSrc = blacklisted ? PLAYER_ICON_INACTIVE : PLAYER_ICON_ACTIVE;
        let tooltip = blacklisted ? "Video will not auto-resume" : "Video will auto-resume";
        let button = this.createPlayerButton(imgSrc, tooltip);
        document.querySelector("div.ytp-right-controls")?.prepend(button);
    }

    createPlayerButton(imgSrc, tooltip) {
        let button = document.createElement("div");
        button.classList.add("ytp-button", "YTAutoResume");
        button.id = "YTAutoResumePlayerSwitch";
        button.title = tooltip;
        button.ariaLabel = tooltip;
        button.style.verticalAlign = "top";
        button.onclick = this.onPlayerButtonClick.bind(this);

        let imgElement = document.createElement("img");
        imgElement.id = "YTAutoResumeSwitchIcon";
        imgElement.src = imgSrc;
        imgElement.style.height = "90%";
        imgElement.style.display = "block";
        imgElement.style.margin = "auto";
        button.appendChild(imgElement);

        return button;
    }

    async onPlayerButtonClick() {
        await this.grabTitle();
        let video = document.querySelector("video");
        let markPlayed = video.duration - video.currentTime < userSettings.markPlayedTime;
        blacklist = document.querySelector("#YTAutoResumePlayerSwitch").checked;

        this.togglePlayerButtonState(blacklist, markPlayed, video);
    }

    async togglePlayerButtonState(blacklist, markPlayed, video) {
        let switchIcon = document.querySelector("#YTAutoResumeSwitchIcon");
        let switchButton = document.querySelector("#YTAutoResumePlayerSwitch");

        switchIcon.src = blacklist ? PLAYER_ICON_INACTIVE : PLAYER_ICON_ACTIVE;
        switchButton.title = blacklist ? "Video will not auto-resume" : "Video will auto-resume";
        switchButton.checked = !blacklist;

        const db = await openDB();
        await setVideo(db, {
            videolink: window.location.href,
            time: video.currentTime,
            duration: video.duration,
            title: document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent,
            channel: document.querySelector(CHANNEL_SELECTOR).textContent,
            complete: markPlayed,
            doNotResume: blacklist
        });
        
        DEBUG && console.log(`Video ${blacklist ? 'blacklisted' : 'removed from blacklist'} successfully`);
    }

    async resetButton() {
        let button = document.querySelector("#YTAutoResumePlayerSwitch");
        if (button) {
            let blacklisted = await this.checkBlacklist(window.location.href);
            let imgSrc = blacklisted ? PLAYER_ICON_INACTIVE : PLAYER_ICON_ACTIVE;
            let tooltip = blacklisted ? "Video will not auto-resume" : "Video will auto-resume";
            button.title = tooltip;
            button.ariaLabel = tooltip;
            button.checked = !blacklisted;
            document.querySelector("#YTAutoResumeSwitchIcon").src = imgSrc;
        } else {
            await this.injectPlayerButton();
        }
    }

    async getUserSettings() {
        const db = await openDB();
        const settings = await getSettings(db);
        DEBUG && console.log('User settings:', settings);
        return settings;
    }

    async initStorage() {
        await migrateData();
    }

    extractWatchID(link) {
        let start = link.indexOf('v=') + 2;
        let end = link.indexOf('&', start);
        return end === -1 ? link.slice(start) : link.slice(start, end);
    }

    grabTitle() {
        return new Promise((resolve, reject) => {
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
        const db = await openDB();
        const videos = await getVideos(db);
        return videos.some(video => this.extractWatchID(video.videolink) === this.extractWatchID(link) && video.doNotResume);
    }

    async setTime(video) {
        const db = await openDB();
        const videos = await getVideos(db);
        const updatedVideos = videos.filter(v => this.extractWatchID(v.videolink) !== this.extractWatchID(video.videolink));
        updatedVideos.push(video);
        await setVideo(db, video);
    }

    async runMainVideoProcess() {
        await this.mainVideoProcess();
        ytNavLoop = true;
    }

    async mainVideoProcess() {
        return new Promise(async resolve => {
            if (!this.checkWatchable(window.location.href) || !this.checkDuration()) {
                resolve();
                return;
            }

            let videoTitle = await this.grabTitle();
            if (!initialLinkIsVideo && !ytNavLoop) {
                resolve();
            }

            try {
                let storedVideo = await this.checkStoredLinks(window.location.href);
                if (storedVideo.time > userSettings.minWatchTime && !storedVideo.complete && !storedVideo.doNotResume) {
                    document.querySelector("video").currentTime = storedVideo.time;
                }
                blacklist = storedVideo.doNotResume;
            } catch {
                blacklist = false;
            }

            this.monitorVideoTime(resolve);
        });
    }

    checkDuration() {
        const video = document.querySelector("video");
        return video.duration >= userSettings.minVideoLength;
    }

    async checkStoredLinks(link) {
        const db = await openDB();
        const videos = await getVideos(db);
        const videoFound = videos.find(video => this.extractWatchID(video.videolink) === this.extractWatchID(link));
        if (videoFound) {
            if (this.daysSince(videoFound.timestamp) > userSettings.deleteAfter) {
                await deleteVideo(db, videoFound.videolink);
                throw new Error("Video expired");
            } else {
                return videoFound;
            }
        } else {
            throw new Error("Video not found");
        }
    }

    async deleteVideo(video) {
        const db = await openDB();
        await deleteVideo(db, video.videolink);
    }

    daysSince(time1) {
        let currentTime = new Date().getTime();
        return Math.round((currentTime - time1) / 86400000);
    }

    monitorVideoTime(resolve) {
        let video = document.querySelector("video");
        let lastTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent;

        video.ontimeupdate = () => {
            let currentTitle = document.querySelector("h1.title.style-scope.ytd-video-primary-info-renderer").textContent;
            if (currentTitle !== lastTitle) {
                resolve();
                return;
            }

            if (!blacklist) {
                let markPlayed = video.duration - video.currentTime < userSettings.markPlayedTime;
                this.setTime({
                    videolink: window.location.href,
                    time: video.currentTime,
                    duration: video.duration,
                    title: currentTitle,
                    channel: document.querySelector(CHANNEL_SELECTOR).textContent,
                    complete: markPlayed,
                    doNotResume: false
                });
            }
            DEBUG && console.log(document.querySelector(CHANNEL_SELECTOR).textContent);
        };
    }
}

new YouTubeAutoResume();