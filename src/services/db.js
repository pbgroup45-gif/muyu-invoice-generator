const isTest = process.env.NODE_ENV === "test";
let pool;
let sqliteDb;

if (isTest) {
	// Use better-sqlite3 for in-memory testing
	const Database = require("better-sqlite3");
	sqliteDb = new Database(":memory:");
} else {
	// Use pg for production/development
	const { Pool } = require("pg");
	pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	// Mandatory to prevent ECONNRESET or other idle client errors from hanging/crashing the process
	pool.on("error", (err) => {
		console.error("Unexpected error on idle database client", err);
	});
}

/**
 * Generic query wrapper that delegates to the appropriate driver.
 * Normalizes Postgres $1, $2 placeholders to SQLite ? if in test mode.
 */
async function query(text, params = []) {
	if (isTest) {
		const sqliteSql = text.replace(/\$(\d+)/g, "?");
		const stmt = sqliteDb.prepare(sqliteSql);

		// Determine if the statement should return rows
		const isRowReturning = /^\s*(SELECT|PRAGMA|WITH|VALUES)/i.test(text);

		if (isRowReturning) {
			const rows = stmt.all(params);
			return { rows, rowCount: rows.length };
		} else {
			const result = stmt.run(params);
			if (text.toUpperCase().includes("RETURNING *")) {
				const tableName = text.match(/INTO\s+(\w+)/i)[1];
				const lastRow = sqliteDb
					.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`)
					.get(result.lastInsertRowid);
				return { rows: [lastRow], rowCount: 1 };
			}
			return { rows: [], rowCount: result.changes };
		}
	}
	return pool.query(text, params);
}

async function initDB() {
	const pk = isTest
		? "INTEGER PRIMARY KEY AUTOINCREMENT"
		: "SERIAL PRIMARY KEY";
	const jsonType = isTest ? "TEXT" : "JSONB";

	// In SQLite, we don't need to connect/release
	await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id ${pk},
      company_name TEXT NOT NULL,
      company_details TEXT,
      owner_email TEXT,
      tax_rate NUMERIC,
      subtotal NUMERIC,
      total NUMERIC,
      items ${jsonType},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

	if (!isTest) {
		await query(
			`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS owner_email TEXT;`,
		);
	}
	await query(
		`CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_email);`,
	);

	await query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      email TEXT PRIMARY KEY,
      company_name TEXT,
      company_details TEXT,
      default_tax_rate NUMERIC,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

	console.log("Database initialized");
}

async function saveInvoice(invoiceData) {
	const {
		companyName,
		companyDetails,
		taxRate,
		subtotal,
		total,
		items,
		owner_email,
	} = invoiceData;
	const result = await query(
		"INSERT INTO invoices (company_name, company_details, tax_rate, subtotal, total, items, owner_email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
		[
			companyName,
			companyDetails,
			taxRate,
			subtotal,
			total,
			isTest ? JSON.stringify(items) : items,
			owner_email,
		],
	);

	const row = result.rows[0];
	// SQLite returns JSON as string; Postgres returns as object
	if (isTest && typeof row.items === "string") {
		row.items = JSON.parse(row.items);
	}
	return row;
}

async function getInvoicesByOwner(email) {
	const result = await query(
		"SELECT * FROM invoices WHERE owner_email = $1 ORDER BY created_at DESC",
		[email],
	);
	return result.rows.map((row) => {
		if (isTest && typeof row.items === "string") {
			row.items = JSON.parse(row.items);
		}
		return row;
	});
}

async function getInvoiceById(id) {
	const result = await query("SELECT * FROM invoices WHERE id = $1", [id]);
	const row = result.rows[0];
	if (row && isTest && typeof row.items === "string") {
		row.items = JSON.parse(row.items);
	}
	return row;
}

async function upsertProfile(profileData) {
	const { email, company_name, company_details, default_tax_rate } =
		profileData;

	if (isTest) {
		// SQLite upsert syntax is slightly different but ON CONFLICT works similarly
		const result = await query(
			`INSERT INTO user_profiles (email, company_name, company_details, default_tax_rate, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         company_details = EXCLUDED.company_details,
         default_tax_rate = EXCLUDED.default_tax_rate,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
			[email, company_name, company_details, default_tax_rate],
		);
		return result.rows[0];
	}

	const result = await query(
		`INSERT INTO user_profiles (email, company_name, company_details, default_tax_rate, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (email) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       company_details = EXCLUDED.company_details,
       default_tax_rate = EXCLUDED.default_tax_rate,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
		[email, company_name, company_details, default_tax_rate],
	);
	return result.rows[0];
}

async function getProfileByEmail(email) {
	const result = await query("SELECT * FROM user_profiles WHERE email = $1", [
		email,
	]);
	return result.rows[0] || null;
}

module.exports = {
	pool: isTest ? { end: async () => {} } : pool,
	query, // Export for tests
	initDB,
	saveInvoice,
	getInvoicesByOwner,
	getInvoiceById,
	upsertProfile,
	getProfileByEmail,
};
