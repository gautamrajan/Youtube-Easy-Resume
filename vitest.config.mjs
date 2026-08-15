import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'h',
      pragmaFrag: 'Fragment'
    }
  },
  resolve: {
    alias: [{
      find: /^preact-material-components\/.+$/,
      replacement: path.join(
        rootDir,
        'preact-ytautoresume/tests/__mocks__/componentMock.js'
      )
    }]
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'https://www.youtube.com/watch?v=test-video'
      }
    },
    globals: true,
    include: ['preact-ytautoresume/tests/**/*.test.{js,jsx}'],
    setupFiles: [
      './preact-ytautoresume/tests/__mocks__/browserMocks.js',
      './preact-ytautoresume/tests/__mocks__/setupTests.js'
    ]
  }
});
