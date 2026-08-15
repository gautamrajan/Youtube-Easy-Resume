export const YOUTUBE_SELECTORS = Object.freeze({
    video: [
        "video.html5-main-video",
        "video"
    ],
    title: [
        "ytd-watch-metadata h1 yt-formatted-string",
        "ytd-video-primary-info-renderer h1",
        "h1.title.style-scope.ytd-video-primary-info-renderer"
    ],
    channel: [
        "ytd-watch-metadata ytd-channel-name a",
        "#owner ytd-channel-name a",
        "ytd-video-owner-renderer ytd-channel-name a"
    ],
    playerControls: [
        ".ytp-chrome-controls .ytp-right-controls",
        "div.ytp-right-controls"
    ]
});

const TIMESTAMP_PARAMETERS = ["t", "start", "time_continue"];

function getPathVideoId(pathname, prefix) {
    const path = pathname.slice(prefix.length);
    const videoId = path.split("/")[0];
    if (!videoId) {
        return null;
    }
    try {
        return decodeURIComponent(videoId);
    } catch {
        return null;
    }
}

function hasExplicitTimestamp(url) {
    if (TIMESTAMP_PARAMETERS.some(parameter => url.searchParams.has(parameter))) {
        return true;
    }

    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParameters = new URLSearchParams(hash);
    return TIMESTAMP_PARAMETERS.some(parameter => hashParameters.has(parameter));
}

export function parseYouTubeUrl(link) {
    if (typeof link !== "string") {
        return null;
    }

    let url;
    try {
        url = new URL(link);
    } catch {
        return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
    }

    const hostname = url.hostname.toLowerCase();
    const isYouTubeHost = hostname === "youtube.com" || hostname.endsWith(".youtube.com");
    const isPrivateEmbedHost = hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube-nocookie.com");
    let kind = null;
    let videoId = null;

    if (hostname === "youtu.be") {
        kind = "short-link";
        videoId = getPathVideoId(url.pathname, "/");
    } else if (isYouTubeHost && url.pathname === "/watch") {
        kind = "watch";
        videoId = url.searchParams.get("v");
    } else if ((isYouTubeHost || isPrivateEmbedHost) && url.pathname.startsWith("/embed/")) {
        kind = "embed";
        videoId = getPathVideoId(url.pathname, "/embed/");
    } else if (isYouTubeHost && url.pathname.startsWith("/shorts/")) {
        kind = "shorts";
        videoId = getPathVideoId(url.pathname, "/shorts/");
    }

    if (!videoId || !/^[A-Za-z0-9_-]+$/.test(videoId)) {
        return null;
    }

    const explicitTimestamp = hasExplicitTimestamp(url);
    return {
        videoId,
        kind,
        explicitTimestamp,
        resumable: kind === "watch" && !explicitTimestamp
    };
}

export function getYouTubeVideoId(link) {
    return parseYouTubeUrl(link)?.videoId ?? null;
}

export function isResumableYouTubeUrl(link) {
    return parseYouTubeUrl(link)?.resumable === true;
}

export function queryFirst(selectors, root = document) {
    for (const selector of selectors) {
        const element = root.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
}

function createAbortError() {
    return new DOMException("The page operation was canceled", "AbortError");
}

export function isExpectedPageWaitError(error) {
    return error?.name === "AbortError" || error?.name === "TimeoutError";
}

export function waitForElement(selectors, {
    root = document,
    signal,
    timeoutMs = 10000
} = {}) {
    const existingElement = queryFirst(selectors, root);
    if (existingElement) {
        return Promise.resolve(existingElement);
    }
    if (signal?.aborted) {
        return Promise.reject(createAbortError());
    }

    return new Promise((resolve, reject) => {
        const observerTarget = root === document ? document.documentElement : root;
        if (!observerTarget) {
            reject(new DOMException("The document is not ready", "TimeoutError"));
            return;
        }

        let timeout;
        const observer = new MutationObserver(() => {
            const element = queryFirst(selectors, root);
            if (element) {
                cleanup();
                resolve(element);
            }
        });
        const onAbort = () => {
            cleanup();
            reject(createAbortError());
        };
        const cleanup = () => {
            observer.disconnect();
            clearTimeout(timeout);
            signal?.removeEventListener("abort", onAbort);
        };

        observer.observe(observerTarget, { childList: true, subtree: true });
        signal?.addEventListener("abort", onAbort, { once: true });
        timeout = setTimeout(() => {
            cleanup();
            reject(new DOMException("Timed out waiting for the YouTube page", "TimeoutError"));
        }, timeoutMs);
    });
}

export function waitForVideoMetadata(video, {
    signal,
    timeoutMs = 10000
} = {}) {
    const hasMetadata = () => Number.isFinite(video.duration) && video.duration > 0;
    if (hasMetadata()) {
        return Promise.resolve(video);
    }
    if (signal?.aborted) {
        return Promise.reject(createAbortError());
    }

    return new Promise((resolve, reject) => {
        let timeout;
        const onMetadata = () => {
            if (hasMetadata()) {
                cleanup();
                resolve(video);
            }
        };
        const onAbort = () => {
            cleanup();
            reject(createAbortError());
        };
        const cleanup = () => {
            video.removeEventListener("loadedmetadata", onMetadata);
            video.removeEventListener("durationchange", onMetadata);
            clearTimeout(timeout);
            signal?.removeEventListener("abort", onAbort);
        };

        video.addEventListener("loadedmetadata", onMetadata);
        video.addEventListener("durationchange", onMetadata);
        signal?.addEventListener("abort", onAbort, { once: true });
        timeout = setTimeout(() => {
            cleanup();
            reject(new DOMException("Timed out waiting for video metadata", "TimeoutError"));
        }, timeoutMs);
    });
}
