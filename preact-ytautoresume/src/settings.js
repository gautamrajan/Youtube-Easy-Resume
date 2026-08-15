export const DEFAULT_SETTINGS = Object.freeze({
    pauseResume: false,
    minWatchTime: 60,
    minVideoLength: 480,
    markPlayedTime: 60,
    deleteAfter: 30
});

export const NUMERIC_SETTING_RULES = Object.freeze({
    minWatchTime: Object.freeze({
        min: 0,
        max: 24 * 60 * 60,
        message: "Enter a value from 0 to 1,440 minutes."
    }),
    minVideoLength: Object.freeze({
        min: 0,
        max: 24 * 60 * 60,
        message: "Enter a value from 0 to 1,440 minutes."
    }),
    markPlayedTime: Object.freeze({
        min: 0,
        max: 24 * 60 * 60,
        message: "Enter a value from 0 to 1,440 minutes."
    }),
    deleteAfter: Object.freeze({
        min: 0,
        max: 3650,
        integer: true,
        message: "Enter a whole number from 0 to 3,650 days."
    })
});

function normalizeNumber(key, value) {
    const rule = NUMERIC_SETTING_RULES[key];
    const hasNumericValue = typeof value === "number"
        || (typeof value === "string" && value.trim() !== "");
    const number = hasNumericValue
        ? Number(value)
        : Number.NaN;
    const valid = Number.isFinite(number)
        && number >= rule.min
        && number <= rule.max
        && (!rule.integer || Number.isInteger(number));
    return valid ? number : DEFAULT_SETTINGS[key];
}

export function normalizeSettings(value) {
    const settings = value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    return {
        pauseResume: typeof settings.pauseResume === "boolean"
            ? settings.pauseResume
            : DEFAULT_SETTINGS.pauseResume,
        minWatchTime: normalizeNumber("minWatchTime", settings.minWatchTime),
        minVideoLength: normalizeNumber("minVideoLength", settings.minVideoLength),
        markPlayedTime: normalizeNumber("markPlayedTime", settings.markPlayedTime),
        deleteAfter: normalizeNumber("deleteAfter", settings.deleteAfter)
    };
}

export function validateSettings(settings) {
    const errors = {};
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
        return Object.fromEntries(
            Object.entries(NUMERIC_SETTING_RULES).map(([key, rule]) => [key, rule.message])
        );
    }

    Object.entries(NUMERIC_SETTING_RULES).forEach(([key, rule]) => {
        const value = settings[key];
        if (typeof value !== "number"
            || !Number.isFinite(value)
            || value < rule.min
            || value > rule.max
            || (rule.integer && !Number.isInteger(value))) {
            errors[key] = rule.message;
        }
    });
    if (typeof settings.pauseResume !== "boolean") {
        errors.pauseResume = "Choose whether auto resume is on or off.";
    }
    return errors;
}

export function settingsEqual(left, right) {
    const keys = Object.keys(DEFAULT_SETTINGS);
    return Boolean(left && right)
        && Object.keys(left).length === keys.length
        && Object.keys(right).length === keys.length
        && keys.every(key => left[key] === right[key]);
}
