module.exports = {
	testEnvironment: "node",
	setupFiles: ["<rootDir>/tests/setup.js"],
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "clover"],
	collectCoverageFrom: [
		"src/**/*.js",
		"!src/services/db.js", // We will mock this specifically
	],
	coverageThreshold: {
		global: {
			statements: 80,
			branches: 80,
			functions: 80,
			lines: 80,
		},
	},
};
