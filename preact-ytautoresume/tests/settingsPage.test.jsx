import { h, render } from 'preact';
import SettingsPage from '../src/components/settings';
import { DEFAULT_SETTINGS } from '../src/settings';

describe('settings form', () => {
  beforeEach(() => {
    __resetExtensionStorage({ settings: { ...DEFAULT_SETTINGS } });
    __setExtensionManifest({ name: 'YouTube Easy Resume' });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    render(null, document.body);
  });

  test('labels bounded numeric fields and blocks invalid values', async () => {
    render(<SettingsPage />, document.body);
    await flushPromises();
    await flushPromises();

    const input = document.querySelector('#MinVideoLengthInput');
    expect(document.querySelector('label[for="MinVideoLengthInput"]')).not.toBeNull();
    expect(input.min).toBe('0');
    expect(input.max).toBe('1440');

    input.value = '-1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await Promise.resolve();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('#MinVideoLengthInputError').textContent)
      .toBe('Enter a value from 0 to 1,440 minutes.');
    expect(document.querySelector('#SaveButton').disabled).toBe(true);

    document.querySelector('form').dispatchEvent(new Event('submit', {
      bubbles: true,
      cancelable: true
    }));
    await flushPromises();
    expect(__getExtensionStorageSetCalls()).toHaveLength(0);
  });

  test('converts valid form values to the documented numeric shape', async () => {
    render(<SettingsPage />, document.body);
    await flushPromises();
    await flushPromises();

    const watchTime = document.querySelector('#MinWatchTimeInput');
    watchTime.value = '2.5';
    watchTime.dispatchEvent(new Event('input', { bubbles: true }));
    await Promise.resolve();

    const form = document.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(__getExtensionStorage().settings).toEqual({
      ...DEFAULT_SETTINGS,
      minWatchTime: 150
    });
    expect(typeof __getExtensionStorage().settings.minWatchTime).toBe('number');
    expect(document.querySelector('#SaveButton')).toBeNull();
  });

  test('keeps Annenberg attribution in Chrome and hides it in Firefox', async () => {
    render(<SettingsPage />, document.body);
    await flushPromises();
    expect(document.querySelector('.MadeBy').textContent).toContain('Annenberg Media');

    render(null, document.body);
    __setExtensionManifest({
      name: 'Easy Resume for YouTube',
      browser_specific_settings: { gecko: { id: 'test@example.com' } }
    });
    render(<SettingsPage />, document.body);
    await flushPromises();
    expect(document.querySelector('.MadeBy')).toBeNull();
  });
});
