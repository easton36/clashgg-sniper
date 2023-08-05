module.exports = {
	apps: [{
		name: 'Clash.gg Bot',
		script: 'src/index.js',
		watch: false,

		max_restarts: 5,
		restart_delay: 1000,
		min_uptime: 5000,
		autorestart: false,

		log_date_format: 'YYYY-MM-DD HH:mm Z',
		error_file: './logs/CONSOLE_ERROR.log',
		out_file: './logs/CONSOLE_OUT.log'
	}]
};