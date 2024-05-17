import { Config } from '@jest/types';

const rootTestDirectory = '<rootDir>/test';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        `${rootTestDirectory}/**/*.test.ts`
    ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    }
}

export default config;