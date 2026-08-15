import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  settingsEqual,
  validateSettings
} from '../src/settings';

describe('settings schema', () => {
  test('normalizes legacy strings and removes unknown fields', () => {
    const settings = normalizeSettings({
      pauseResume: true,
      minWatchTime: '90',
      minVideoLength: '600',
      markPlayedTime: '45',
      deleteAfter: '60',
      obsoleteSetting: true
    });

    expect(settings).toEqual({
      pauseResume: true,
      minWatchTime: 90,
      minVideoLength: 600,
      markPlayedTime: 45,
      deleteAfter: 60
    });
    Object.values(settings).forEach(value => {
      expect(['boolean', 'number']).toContain(typeof value);
    });
  });

  test('repairs missing, empty, non-finite, and out-of-range values', () => {
    expect(normalizeSettings({
      pauseResume: 'false',
      minWatchTime: '',
      minVideoLength: Number.POSITIVE_INFINITY,
      markPlayedTime: -1,
      deleteAfter: 2.5
    })).toEqual(DEFAULT_SETTINGS);
  });

  test('reports each invalid draft without changing it', () => {
    const draft = {
      pauseResume: false,
      minWatchTime: Number.NaN,
      minVideoLength: 86401,
      markPlayedTime: -1,
      deleteAfter: 3.5
    };

    expect(validateSettings(draft)).toEqual({
      minWatchTime: 'Enter a value from 0 to 1,440 minutes.',
      minVideoLength: 'Enter a value from 0 to 1,440 minutes.',
      markPlayedTime: 'Enter a value from 0 to 1,440 minutes.',
      deleteAfter: 'Enter a whole number from 0 to 3,650 days.'
    });
    expect(Number.isNaN(draft.minWatchTime)).toBe(true);
  });

  test('compares the complete persisted shape', () => {
    expect(settingsEqual(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS })).toBe(true);
    expect(settingsEqual(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS, extra: true })).toBe(false);
    expect(settingsEqual(DEFAULT_SETTINGS, { ...DEFAULT_SETTINGS, deleteAfter: 31 })).toBe(false);
  });
});
