const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf } = format;

const logger = createLogger({
	format: combine(
		timestamp({
			format: 'YYYY-MM-DD HH:mm:ss Z'
		}),
		printf(({ level, message, timestamp }) => {
			return `${timestamp}: [${level.toUpperCase()}] ${message}`;
		}),
		colorize({
			all: true,
			colors: {
				error: 'red',
				warn: 'yellow',
				info: 'cyan',
				debug: 'green'
			}
		})
	),
	transports: [
		new transports.Console()
	]
});

module.exports = logger;