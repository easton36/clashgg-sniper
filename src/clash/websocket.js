const WebSocket = require('ws');
const crypto = require('crypto');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

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
	let updateInProgress = false;

	let wsClosedCount = 0;

	/**
	 * Generates the Sec-WebSocket-Key
	 * @param {String} plaintext - The plaintext to generate the Sec-WebSocket-Key
	 * @returns {String} The generated Sec-WebSocket-Key
	 */
	const genSecWebSocketKey = (plaintext = 'Sampli\'s Clash Script') => {
		const md5Hash = crypto.createHash('md5').update(plaintext).digest('hex');
		const base64Hash = Buffer.from(md5Hash, 'hex').toString('base64');

		return base64Hash;
	};

	const DEFAULT_HEADERS = {
		Origin: 'https://clash.gg',
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-US,en;q=0.9',
		'User-Agent': CONFIG.USER_AGENT,
		Pragma: 'no-cache',
		Upgrade: 'websocket',
		'Sec-WebSocket-Key': genSecWebSocketKey()
	};

	/**
	 * Initialize the WebSocket connection
	 */
	const initialize = () => {
		socket = new WebSocket(CONFIG.CLASH_WS_URL, {
			headers: {
				...DEFAULT_HEADERS,
				Authorization: `Bearer ${accessToken}`,
				Cookie: `cf_clearance=${cfClearance}`
			}
		});

		// WebSocket events
		socket.on('open', _open);
		socket.on('error', _error);
		socket.on('close', _close);
		socket.on('message', _message);
	};

	/**
	 * Close the WebSocket connection
	 */
	const close = () => {
		socket.close();

		// turn off the listeners
		socket.off('open', _open);
		socket.off('error', _error);
		socket.off('close', _close);
		socket.off('message', _message);
	};

	/**
	 * Update the access token
	 * @param {String} newAccessToken - The new access token
	 * @param {String} newCfClearance - The new cf_clearance cookie
	 */
	const updateAccessToken = (newAccessToken, newCfClearance) => {
		try{
			// if an update is already in progress, return
			if(updateInProgress) return;
			Logger.info('[WEBSOCKET] Updating the access token...');

			updateInProgress = true;
			// update the access token
			accessToken = newAccessToken;
			cfClearance = newCfClearance;

			// close the WebSocket connection
			close();

			// re-initialize the WebSocket connection
			initialize();
			updateInProgress = false;
		} catch(err){
			Logger.error(`[WEBSOCKET] An error occurred while updating the access token: ${err.message || err}`);

			// if an error occurred, try again, but wait 5 seconds
			setTimeout(() => {
				updateAccessToken(newAccessToken, newCfClearance);
			}, 5000);
		}
	};

	/**
	 * When the WebSocket connection is opened
	 * @returns {void}
	 */
	const _open = () => {
		// emit "auth" event
		socket.send(JSON.stringify(['auth', accessToken]));

		wsClosedCount = 0;

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

		callback('socket_closed');

		wsClosedCount++;
		Logger.warn(`[WEBSOCKET] WebSocket closed. Code: ${code}, Reason: ${reason || 'N/A'}`);

		if(wsClosedCount >= 5){
			Logger.error('[WEBSOCKET] WebSocket closed 5 times. Exiting...');
			process.exit(1);
		}
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

	// initialize the WebSocket connection
	initialize();

	return {
		updateAccessToken
	};
};

module.exports = ClashWebsocket;