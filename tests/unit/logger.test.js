const { logger } = require("../../src/services/logger");

describe("Logger Service", () => {
	test("should cover logger error and warn methods", () => {
		const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
		const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

		logger.error("test error");
		logger.warn("test warn");

		expect(errorSpy).toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalled();

		errorSpy.mockRestore();
		warnSpy.mockRestore();
	});
});
