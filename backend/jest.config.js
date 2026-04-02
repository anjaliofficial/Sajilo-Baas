module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/test/**/*.test.ts'],
    rootDir: '.',
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleNameMapper: {
        '^uuid$': '<rootDir>/src/__tests__/__mocks__/uuid.js',
        '^mime$': '<rootDir>/src/__tests__/__mocks__/mime.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(mime|uuid)/)',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/app.ts',
        '!src/__tests__/**',
    ],
    coverageDirectory: '<rootDir>/coverage',
    verbose: true,
    testTimeout: 60000,
    setupFilesAfterEnv: ['<rootDir>/test/setup/setupTests.ts'],
};