const { calculateInvoice } = require("../../src/services/calculations");

describe("calculateInvoice", () => {
	test("should calculate subtotal, taxAmount, and total correctly", () => {
		const expenses = [
			{ description: "Item 1", cost: "100" },
			{ description: "Item 2", cost: "50" },
		];
		const taxRate = "10";
		const result = calculateInvoice(expenses, taxRate);

		expect(result.subtotal).toBe(150);
		expect(result.taxAmount).toBe(15);
		expect(result.total).toBe(165);
		expect(result.taxRate).toBe(10);
		expect(result.items).toHaveLength(2);
		expect(result.items[0].cost).toBe(100);
	});

	test("should handle empty expenses", () => {
		const result = calculateInvoice([], 10);
		expect(result.subtotal).toBe(0);
		expect(result.taxAmount).toBe(0);
		expect(result.total).toBe(0);
	});

	test("should handle invalid cost strings by defaulting to 0", () => {
		const expenses = [{ description: "Invalid", cost: "invalid" }];
		const result = calculateInvoice(expenses, 10);
		expect(result.subtotal).toBe(0);
		expect(result.total).toBe(0);
	});

	test("should handle rounding precision", () => {
		const expenses = [{ description: "Precise", cost: "10.333333" }];
		const result = calculateInvoice(expenses, 0);
		expect(result.subtotal).toBe(10.33);
	});

	test("should handle numeric tax rate", () => {
		const expenses = [{ description: "Item", cost: 100 }];
		const result = calculateInvoice(expenses, 5);
		expect(result.taxAmount).toBe(5);
	});

	test("should handle non-array expenses by defaulting to empty array", () => {
		const result = calculateInvoice(null, 10);
		expect(result.subtotal).toBe(0);
		expect(result.items).toEqual([]);
	});

	test("should handle items with missing cost", () => {
		const expenses = [{ description: "No cost" }];
		const result = calculateInvoice(expenses, 0);
		expect(result.subtotal).toBe(0);
		expect(result.items[0].cost).toBe(0);
	});
});
