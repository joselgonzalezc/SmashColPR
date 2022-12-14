// const { pathsToModuleNameMapper } = require("ts-jest");
// const { compilerOptions } = require("./tsconfig");

module.exports = {
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
  //   prefix: "<rootDir>/src",
  // }),
  preset: "ts-jest",
  roots: ["<rootDir>/test"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/dist"],
  verbose: true,
};
