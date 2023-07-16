const WebSocket = require('ws');

const Logger = require('./utils/logger.util');
const CONFIG = require('./config');

const DEFAULT_HEADERS = {
	'Origin': 'https://clash.gg',
	'Accept-Encoding': 'gzip, deflate, br',
	'Accept-Language': 'en-US,en;q=0.9',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
	'Pragma': 'no-cache'
};

/**
 * Clash.gg Websocket manager
 * @param {Object} options - The options for the Clash.gg Websocket manager
 * @param {String} options.accessToken - The access token for the Clash.gg Websocket manager
 * @param {String} options.cfClearance - The cf_clearance cookie for the Clash.gg Websocket manager
 * @param {Function} callback - The callback for the Clash.gg Websocket manager
 */
const ClashWebsocket = ({
	accessToken,
	cfClearance
}, callback) => {
	let socket;

	const initialize = () => {
		socket = new WebSocket(CONFIG.CLASH_WS_URL, {
			headers: {
				...DEFAULT_HEADERS,
				Authorization: `Bearer ${accessToken}`,
				Cookie: `cf_clearance=${cfClearance}`
			}
		});

		socket.on('open', _open);
		socket.on('error', _error);
		socket.on('close', _close);
		socket.on('message', _message);
	};

	/**
	 * When the WebSocket connection is opened
	 * @returns {void}
	 */
	const _open = () => {
		// emit "auth" event
		socket.send(JSON.stringify(['auth', accessToken]));

		return Logger.info(`[WEBSOCKET] Connected to the Clash.gg WebSocket server at ${CONFIG.CLASH_WS_URL}`);
	};

	/**
	 * When the WebSocket connection receives an error
	 * @param {Error} error - The error received from the WebSocket server
	 */
	const _error = (error) => {
		return Logger.error(`[WEBSOCKET] WebSocket error: ${error}`);
	};

	/**
	 * When the WebSocket connection is closed
	 * @param {Number} code - The code of the WebSocket connection
	 * @param {String} reason - The reason of the WebSocket connection
	 * @returns {void}
	 */
	const _close = (code, reason) => {
		// if reason is a buffer, convert it to string
		if(Buffer.isBuffer(reason)){
			reason = reason.toString();
		}
		return Logger.warn(`[WEBSOCKET] WebSocket closed. Code: ${code}, Reason: ${reason || 'N/A'}`);
	};

	/**
	 * When the WebSocket connection receives a message
	 * @param {String} data - The data received from the WebSocket server
	 * @returns {void}
	 */
	const _message = (message) => {
		// Parsing the data as JSON
		const [event, data] = JSON.parse(message);
		if(event){
			return callback(event, data);
		}

		return Logger.warn(`[WEBSOCKET] Received unknown message: ${message}`);
	};


	return {
		initialize
	};
};

module.exports = ClashWebsocket;