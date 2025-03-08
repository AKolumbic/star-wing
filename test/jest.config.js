/**
 * Jest configuration for Star-Wing test suite
 */
module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Use jsdom environment for browser-like DOM
  testEnvironment: "jsdom",

  // The root directory that Jest should scan for tests and modules
  rootDir: "../",

  // Setup file to run before each test
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/test/**/*.test.js",
    "<rootDir>/test/**/*.spec.js",
    "<rootDir>/test/**/*.test.ts", // Add TypeScript test files
    "<rootDir>/test/**/*.spec.ts", // Add TypeScript spec files
  ],

  // Transform files with babel-jest and ts-jest
  transform: {
    "^.+\\.jsx?$": [
      "babel-jest",
      { configFile: "<rootDir>/test/babel.config.js" },
    ],
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/test/tsconfig.json", // Point to our test tsconfig
        babelConfig: "<rootDir>/test/babel.config.js",
      },
    ],
  },

  // Module file extensions for importing
  moduleFileExtensions: ["js", "json", "jsx", "node", "ts", "tsx"], // Add ts and tsx

  // Mock static assets
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/test/mocks/fileMock.js",
    "\\.(css|less|scss|sass)$": "<rootDir>/test/mocks/styleMock.js",
  },

  // Code coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "src/**/*.{ts,tsx}", // Add TypeScript files for coverage
    "!**/node_modules/**",
    "!**/vendor/**",
    "!**/dist/**",
  ],

  // Coverage output directory
  coverageDirectory: "<rootDir>/coverage",

  // Minimum coverage requirements (eventually)
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Add custom reporters
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./test-results",
        outputName: "junit.xml",
      },
    ],
  ],

  // Maximum time in milliseconds before a test is considered slow
  slowTestThreshold: 5000,
};
