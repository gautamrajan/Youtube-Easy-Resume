import js from '@eslint/js';
import globals from 'globals';

const sourceFiles = ['preact-ytautoresume/src/**/*.{js,jsx}'];
const testFiles = ['preact-ytautoresume/tests/**/*.{js,jsx}'];
const extensionTestGlobals = Object.fromEntries([
  '__emitExtensionStorageChange',
  '__getExtensionStorage',
  '__getExtensionStorageRemoveCalls',
  '__getExtensionStorageSetCalls',
  '__getStoredVideos',
  '__resetExtensionStorage',
  '__setExtensionStorageError',
  'flushPromises'
].map(name => [name, 'readonly']));

export default [
  {
    ignores: ['build/**', 'coverage/**', 'dist/**']
  },
  {
    ...js.configs.recommended,
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^h$' }]
    }
  },
  {
    ...js.configs.recommended,
    files: testFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
        ...extensionTestGlobals
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^h$' }]
    }
  },
  {
    files: ['scripts/**/*.mjs', '*.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module'
    }
  }
];
