import { resolveExtensionApi } from '../src/extensionApi';

describe('cross-browser extension API', () => {
  test('prefers the Firefox browser namespace when it is available', () => {
    const browser = { runtime: {}, storage: {} };
    const chrome = { runtime: {}, storage: {} };

    expect(resolveExtensionApi({ browser, chrome })).toBe(browser);
  });

  test('uses the Chrome namespace otherwise', () => {
    const chrome = { runtime: {}, storage: {} };

    expect(resolveExtensionApi({ chrome })).toBe(chrome);
  });
});
