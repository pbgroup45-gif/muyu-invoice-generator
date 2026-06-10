const { pool, initDB, query } = require("../../src/services/db");

describe("Database Schema", () => {
	beforeAll(async () => {
		await initDB();
	});

	afterAll(async () => {
		await pool.end();
	});

	test("database should have owner_email column in invoices table", async () => {
		const isSQLite = process.env.NODE_ENV === "test";

		if (isSQLite) {
			const { rows } = await query("PRAGMA table_info(invoices)");
			const hasColumn = rows.some((r) => r.name === "owner_email");
			expect(hasColumn).toBe(true);
		} else {
			const res = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='invoices' AND column_name='owner_email'
      `);
			expect(res.rowCount).toBe(1);
		}
	});

	test("database should have user_profiles table", async () => {
		const isSQLite = process.env.NODE_ENV === "test";

		if (isSQLite) {
			const { rows } = await query(
				"SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles'",
			);
			expect(rows.length).toBe(1);
		} else {
			const res = await pool.query(
				"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles'",
			);
			expect(res.rowCount).toBe(1);
		}
	});
});
