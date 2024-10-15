const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './'
});

// Add custom config here
const customJestConfig = {
    preset: 'ts-jest',
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        // Handle CSS imports (with CSS modules)
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

        // Handle image imports
        '^.+\\.(png|jpg|jpeg|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js'
    },
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    }
};

module.exports = createJestConfig(customJestConfig);
