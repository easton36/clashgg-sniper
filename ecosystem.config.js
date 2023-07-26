module.exports = {
	apps: [{
		name: 'Clash.gg Bot',
		script: 'src/index.js',
		watch: false,

		max_restarts: 5,
		autorestart: true,

		log_date_format: 'YYYY-MM-DD HH:mm Z',
		error_file: './logs/CONSOLE_ERROR.log',
		out_file: './logs/CONSOLE_OUT.log'
	}]
};