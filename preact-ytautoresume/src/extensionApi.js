/* global globalThis */

export function resolveExtensionApi(environment = globalThis) {
    const api = environment.browser || environment.chrome;
    if (!api || !api.runtime || !api.storage) {
        throw new Error("WebExtension APIs are unavailable");
    }
    return api;
}

export default resolveExtensionApi();
