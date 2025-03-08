export default {
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "jsdom",
  testMatch: ["**/test/**/*.test.(ts|js)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
