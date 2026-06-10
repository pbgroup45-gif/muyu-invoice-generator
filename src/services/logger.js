const morgan = require("morgan");

/**
 * Simple text-based logger service.
 * Designed for readability and DevOps teaching.
 */

// Custom token for IP address that handles proxies
morgan.token(
	"real-ip",
	/* istanbul ignore next */ (req) => {
		return req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	},
);

// Custom token for Request ID
morgan.token("id", /* istanbul ignore next */ (req) => req.id || "-");

/**
 * Morgan middleware for HTTP request logging.
 */
const httpLogger = morgan((tokens, req, res) => {
	return [
		`[${new Date().toISOString()}]`,
		tokens.method(req, res),
		tokens.url(req, res),
		tokens.status(req, res),
		`(${tokens["response-time"](req, res)} ms)`,
		"- IP:",
		tokens["real-ip"](req, res),
		"- UA:",
		tokens["user-agent"](req, res),
	].join(" ");
});

/**
 * Generic logger for system events.
 */
const logger = {
	info: (msg, ...args) =>
		console.log(`[${new Date().toISOString()}] INFO: ${msg}`, ...args),
	/* istanbul ignore next */
	error: (msg, ...args) =>
		console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, ...args),
	/* istanbul ignore next */
	warn: (msg, ...args) =>
		console.warn(`[${new Date().toISOString()}] WARN: ${msg}`, ...args),
};

module.exports = { logger, httpLogger };
