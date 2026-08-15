export const SCHEMA_VERSION = 1;
export const SCHEMA_VERSION_KEY = "videoStorageVersion";
export const VIDEO_KEY_PREFIX = "video:";
export const LEGACY_VIDEO_KEY_PREFIX = "legacyVideo:";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getVideoId(link) {
    if (typeof link !== "string") {
        return null;
    }

    try {
        return new URL(link).searchParams.get("v");
    } catch {
        const match = link.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    }
}

export function getVideoKey(link) {
    const videoId = getVideoId(link);
    return videoId ? VIDEO_KEY_PREFIX + encodeURIComponent(videoId) : null;
}

export function getLegacyVideoKey(link) {
    const videoId = getVideoId(link);
    return videoId ? LEGACY_VIDEO_KEY_PREFIX + encodeURIComponent(videoId) : null;
}

function hasValidUpdatedAt(video) {
    return video && Number.isFinite(video.updatedAt) && video.updatedAt >= 0;
}

function normalizeVideo(video, fallbackTime) {
    if (!video || typeof video !== "object" || !getVideoKey(video.videolink)) {
        return null;
    }

    const normalized = Object.assign({}, video);
    const legacyTime = Number.isFinite(video.timestamp) ? video.timestamp : null;
    normalized.updatedAt = hasValidUpdatedAt(video) ? video.updatedAt : legacyTime ?? fallbackTime;
    delete normalized.timestamp;
    return normalized;
}

export function createVideoStorage(storageArea, now = Date.now) {
    if (!storageArea) {
        throw new Error("A browser storage area is required");
    }

    const currentTime = now;
    const get = keys => storageArea.get(keys);
    const set = values => storageArea.set(values);
    const remove = keys => storageArea.remove(keys);

    async function initialize() {
        const data = await get(null);
        const storedVersion = data[SCHEMA_VERSION_KEY];

        if (storedVersion === SCHEMA_VERSION) {
            return;
        }
        if (Number.isFinite(storedVersion) && storedVersion > SCHEMA_VERSION) {
            throw new Error(`Unsupported video storage version: ${storedVersion}`);
        }

        const migrationTime = currentTime();
        const migratedRecords = {};
        const legacyVideos = Array.isArray(data.videos) ? data.videos : [];

        legacyVideos.forEach(legacyVideo => {
            const video = normalizeVideo(legacyVideo, migrationTime);
            if (!video) {
                return;
            }

            const canonicalKey = getVideoKey(video.videolink);
            if (hasValidUpdatedAt(data[canonicalKey])) {
                return;
            }

            const key = getLegacyVideoKey(video.videolink);
            const currentRecord = migratedRecords[key] || data[key];
            if (!hasValidUpdatedAt(currentRecord) || video.updatedAt >= currentRecord.updatedAt) {
                migratedRecords[key] = video;
            }
        });

        if (Object.keys(migratedRecords).length > 0) {
            await set(migratedRecords);
        }
        if (Object.prototype.hasOwnProperty.call(data, "videos")) {
            await remove("videos");
        }
        await set({ [SCHEMA_VERSION_KEY]: SCHEMA_VERSION });
    }

    async function saveVideo(video) {
        const savedAt = currentTime();
        const normalized = normalizeVideo(video, savedAt);
        if (!normalized) {
            throw new Error("Cannot save a video without a valid YouTube watch URL");
        }

        normalized.updatedAt = savedAt;
        await set({ [getVideoKey(normalized.videolink)]: normalized });
        await remove(getLegacyVideoKey(normalized.videolink));
        return normalized;
    }

    async function getVideo(link) {
        const canonicalKey = getVideoKey(link);
        const legacyKey = getLegacyVideoKey(link);
        if (!canonicalKey) {
            return null;
        }

        const data = await get([canonicalKey, legacyKey]);
        if (hasValidUpdatedAt(data[canonicalKey])) {
            return data[canonicalKey];
        }
        return hasValidUpdatedAt(data[legacyKey]) ? data[legacyKey] : null;
    }

    async function getAllVideos() {
        const data = await get(null);
        const videosById = {};
        const collect = prefix => {
            Object.keys(data)
                .filter(key => key.startsWith(prefix))
                .map(key => data[key])
                .filter(video => hasValidUpdatedAt(video) && getVideoId(video.videolink))
                .forEach(video => {
                    videosById[getVideoId(video.videolink)] = video;
                });
        };

        collect(LEGACY_VIDEO_KEY_PREFIX);
        collect(VIDEO_KEY_PREFIX);
        return Object.values(videosById)
            .sort((left, right) => left.updatedAt - right.updatedAt);
    }

    async function removeVideo(videoOrLink) {
        const link = typeof videoOrLink === "string" ? videoOrLink : videoOrLink && videoOrLink.videolink;
        const canonicalKey = getVideoKey(link);
        if (canonicalKey) {
            await remove([canonicalKey, getLegacyVideoKey(link)]);
        }
    }

    async function removeVideos(videos) {
        const keys = videos
            .reduce((result, video) => {
                const link = video && video.videolink;
                const canonicalKey = getVideoKey(link);
                if (canonicalKey) {
                    result.push(canonicalKey, getLegacyVideoKey(link));
                }
                return result;
            }, [])
            .filter(Boolean);
        if (keys.length > 0) {
            await remove(Array.from(new Set(keys)));
        }
    }

    function isExpired(video, deleteAfterDays, comparisonTime) {
        const days = Number(deleteAfterDays);
        if (!hasValidUpdatedAt(video) || !Number.isFinite(days) || days < 0) {
            return false;
        }
        const timestamp = comparisonTime === undefined ? currentTime() : comparisonTime;
        return timestamp - video.updatedAt > days * DAY_IN_MS;
    }

    async function deleteExpired(deleteAfterDays) {
        const comparisonTime = currentTime();
        const videos = await getAllVideos();
        const expired = videos.filter(video => {
            return isExpired(video, deleteAfterDays, comparisonTime);
        });
        await removeVideos(expired);
        return videos.filter(video => !expired.includes(video));
    }

    return {
        initialize,
        saveVideo,
        getVideo,
        getAllVideos,
        removeVideo,
        removeVideos,
        isExpired,
        deleteExpired
    };
}
