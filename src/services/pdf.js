const PDFDocument = require("pdfkit");

function generatePDF(invoice) {
	return new Promise((resolve, _reject) => {
		const doc = new PDFDocument({ margin: 50 });
		const buffers = [];
		doc.on("data", buffers.push.bind(buffers));
		doc.on("end", () => {
			const pdfData = Buffer.concat(buffers);
			resolve(pdfData);
		});

		// Header
		doc.fontSize(25).text("INVOICE", { align: "right" });
		doc.fontSize(10).text(`Invoice #: ${invoice.id}`, { align: "right" });
		doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, {
			align: "right",
		});
		doc.moveDown();

		// Company Info
		doc.fontSize(14).text("FROM:", { underline: true });
		doc.fontSize(12).text(invoice.company_name);
		doc
			.fontSize(10)
			.text(
				invoice.company_details
					? invoice.company_details.replace(/\r/g, "")
					: "",
			);
		doc.moveDown();

		// Table Header
		const tableTop = 250;
		doc.fontSize(10).text("Description", 50, tableTop, { bold: true });
		doc.text("Cost", 400, tableTop, { align: "right", bold: true });
		doc
			.moveTo(50, tableTop + 15)
			.lineTo(550, tableTop + 15)
			.stroke();

		// Items
		let currentY = tableTop + 25;
		invoice.items.forEach((item) => {
			doc.text(item.description, 50, currentY);
			doc.text(`$${parseFloat(item.cost).toFixed(2)}`, 400, currentY, {
				align: "right",
			});
			currentY += 20;
		});

		// Summary
		doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
		currentY += 15;

		// Subtotal
		doc.text("Subtotal:", 350, currentY, { width: 100, align: "right" });
		doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, currentY, {
			width: 100,
			align: "right",
		});

		currentY += 20;
		// Tax
		doc.text(`Tax (${invoice.tax_rate}%):`, 350, currentY, {
			width: 100,
			align: "right",
		});
		doc.text(
			`$${(invoice.total - invoice.subtotal).toFixed(2)}`,
			450,
			currentY,
			{ width: 100, align: "right" },
		);

		currentY += 25;
		// Total
		doc.fontSize(14);
		doc.text("TOTAL:", 350, currentY, {
			width: 100,
			align: "right",
			bold: true,
		});
		doc.text(`$${parseFloat(invoice.total).toFixed(2)}`, 450, currentY, {
			width: 100,
			align: "right",
			bold: true,
		});

		// Footer
		doc.fontSize(10).text("Thank you for your business!", 50, 700, {
			align: "center",
			color: "grey",
		});

		doc.end();
	});
}

module.exports = {
	generatePDF,
};
