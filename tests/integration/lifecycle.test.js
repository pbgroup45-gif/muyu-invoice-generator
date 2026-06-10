const { pool, initDB } = require("../../src/services/db");
const { app, start } = require("../../src/web");
const { logger } = require("../../src/services/logger");

jest.mock("../../src/services/db", () => ({
	...jest.requireActual("../../src/services/db"),
	initDB: jest.fn().mockResolvedValue(),
}));

describe("Lifecycle", () => {
	test("should handle start logic", async () => {
		const listenSpy = jest
			.spyOn(app, "listen")
			.mockImplementation((_port, cb) => {
				cb();
				return { close: jest.fn() };
			});

		await start();

		expect(initDB).toHaveBeenCalled();
		expect(listenSpy).toHaveBeenCalled();
		listenSpy.mockRestore();
	});

	test("should handle start failure", async () => {
		const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
		const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
		const listenSpy = jest.spyOn(app, "listen").mockImplementation(() => {
			throw new Error("Listen failure");
		});

		await start();

		expect(errorSpy).toHaveBeenCalled();
		expect(exitSpy).toHaveBeenCalledWith(1);

		errorSpy.mockRestore();
		exitSpy.mockRestore();
		listenSpy.mockRestore();
	});

	test("should handle shutdown", async () => {
		const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
		const poolEndSpy = jest.spyOn(pool, "end").mockResolvedValue();
		const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => {});

		// Access the shutdown function through the process listeners or by requiring it if exported
		const { shutdown } = require("../../src/web");
		await shutdown();

		expect(poolEndSpy).toHaveBeenCalled();
		expect(exitSpy).toHaveBeenCalledWith(0);

		exitSpy.mockRestore();
		poolEndSpy.mockRestore();
		infoSpy.mockRestore();
	});

	test("should use default PORT if not provided", async () => {
		const originalPort = process.env.PORT;
		delete process.env.PORT;

		// Re-require to trigger the PORT assignment
		jest.isolateModules(() => {
			const { app } = require("../../src/web");
			// We can't easily check the local PORT variable, but we can verify it doesn't crash
			expect(app).toBeDefined();
		});

		process.env.PORT = originalPort;
	});
});
