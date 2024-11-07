import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'jest-playwright-preset',
  testMatch: ['**/e2e/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFilesAfterEnv: ['./setup.ts'],
  testEnvironment: 'node',
  testTimeout: 30000,
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports/e2e',
      outputName: 'junit.xml',
      classNameTemplate: '{filepath}',
      titleTemplate: '{title}'
    }]
  ]
};

export default config; 