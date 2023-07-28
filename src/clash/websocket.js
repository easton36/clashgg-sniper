const WebSocket = require('ws');
const crypto = require('crypto');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

/**
 * Roulette websocket events:
 *
 * Receive jackpot: ["roulette:jackpot",{"jackpot":413375.84249999997}]
 * Receive bet: ["roulette:bet",{"user":{"id":571692,"avatar":"https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg","name":"Pronoob14","role":"user","xp":863816},"gameId":373204,"amount":30,"option":"GREEN"}]
 * Receive round: ["roulette:round",{"id":373203,"status":"OPEN","outcome":null,"serialId":null,"drawsAt":"2023-07-28T04:31:49.039Z","createdAt":"2023-07-28T04:31:29.039Z","updatedAt":"2023-07-28T04:31:29.040Z","serverTime":"2023-07-28T04:31:29.042Z"}]
 */

/**
 * Battle websocket events:
 *
 * New round: ["battles:round",{"battleId":4568143,"drops":[{"item":{"name":"MP9 | Slide (Factory New)","image":"https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou6r8FA957ODYfTxW-Nmkx7-HnvD8J_XUzjwJupdw3-rA8I6jiQPl80I5Yzz7IoCTcwRtZl3VrFa2l-jp18O9ot2XnhWS9Knh","price":8,"ticketsEnd":100000,"ticketsStart":45000},"result":87030,"battlePlayerId":16455267,"team":1,"userId":397562,"botId":null,"seed":"SnxHKknl9Lu0yQ8znh6c19v9DtLbH9sF:13:1"},{"item":{"name":"CZ75-Auto | Silver (Factory New)","image":"https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotaDyfgZf0v33YjRO-tmkq4yCkP_gDLfQhGxUpsEo3L-XoNr03FK3_hFtazvwJ9fBcQJsMgzYq1Toyb28gJbuvcvBwSd9-n5106iv1pk","price":98,"ticketsEnd":19999,"ticketsStart":10000},"result":12401,"battlePlayerId":16455270,"team":1,"userId":null,"botId":1,"seed":"SnxHKknl9Lu0yQ8znh6c19v9DtLbH9sF:13:2"},{"item":{"name":"MP9 | Slide (Factory New)","image":"https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou6r8FA957ODYfTxW-Nmkx7-HnvD8J_XUzjwJupdw3-rA8I6jiQPl80I5Yzz7IoCTcwRtZl3VrFa2l-jp18O9ot2XnhWS9Knh","price":8,"ticketsEnd":100000,"ticketsStart":45000},"result":65173,"battlePlayerId":16455271,"team":1,"userId":null,"botId":2,"seed":"SnxHKknl9Lu0yQ8znh6c19v9DtLbH9sF:13:3"},{"item":{"name":"MP9 | Slide (Factory New)","image":"https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou6r8FA957ODYfTxW-Nmkx7-HnvD8J_XUzjwJupdw3-rA8I6jiQPl80I5Yzz7IoCTcwRtZl3VrFa2l-jp18O9ot2XnhWS9Knh","price":8,"ticketsEnd":100000,"ticketsStart":45000},"result":78078,"battlePlayerId":16455272,"team":1,"userId":null,"botId":3,"seed":"SnxHKknl9Lu0yQ8znh6c19v9DtLbH9sF:13:4"}]}]
 * Finished: ["battles:finished",{"battleId":4568150,"winningTeam":1,"isCoinflip":false}]
 * Join bots: ["battles:join-bots",{"battleId":4568179}]
 * Battle rain: ["battles:rain",{"pot":27659.7775}]
 * Start: ["battles:start",{"battleId":4568180,"startsAt":"2023-07-28T04:27:24.476Z","serverTime":"2023-07-28T04:27:21.476Z","seed":"7D1lMRoXfZpPVw8s8ZExfZvZSadOxxbV","proof":{"random":{"method":"generateSignedStrings","hashedApiKey":"6HoRdd+NsxDSdr0RY+RVQd5Nw/Co4AqJz+N036SA5F9pilI59+irVvKf6l3689iIej30Kvza8mXfrC4byOJpUQ==","n":1,"length":32,"characters":"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789","replacement":true,"data":["7D1lMRoXfZpPVw8s8ZExfZvZSadOxxbV"],"license":{"type":"gambling-virtual","text":"Random values licensed for virtual item gambling only","infoUrl":null},"userData":{"battleId":4568180},"completionTime":"2023-07-28 04:27:21Z","serialNumber":5279415},"signature":"AKx2THEitVjBM9N8CrCYKVXhJFGPdNiGZ3qAK32b8inJS9ooHgu5K5bA46YOJgXTD3ut6wC3bgwOIHGwZ6MnBgsTdWxCKvWUq7tAfXhpZq3akpKHg2ETwLdpxEtfBMWomyGsWvF2+8HrTp+PZc7FMeSDYm3xvmDRu8ns6hELO19K4tnXVvHYNIFpslgosnMcbE4D4ny476NBsHyAtXCavl1x++poXesiujxd8mAlEMAdNwkfFV76zFiJt653DVl1FfddXq8ACl2sDCmZKUfux0wU/yJbQt5c7ee4kw2K4CW4Qwno4zLODMOudC6NSeieQUcg9MtL8LHgwxsvgT14NOz1Pq7jJ7DBf/MRQNNbMIEo/zUCOhuYBvNlqwKn99r1W4XT46T7llZtMpeqpLQaxyHi+95w9GuK5YjUq+sIijUfKPmJx/n2OidJdjfq7emBA50dX+4RJnr1LJLVZ/qaFb1Q75a8XQIIVHorMk/AFhW7k/aq7HpkQci/SZeOrGaCksJuUNJqxt3CFVAUiSWFeKeeMjZ3VJ7lr7pnQ+qwS4icbCgrtxmK1p4lH4t8XYFEaxd1r2B4U1IXmglFR9CnvrR4svQhyj1sB/CfG2GZ2WrcvoLPKsp4h2LjdNayavkyEa6DIrepRbSGN1ysJczpp0CPTn7IDYBafP2AUeSkp/o="}}]
 *
 */

/**
 * Mines websocket events:
 *
 * New game: ["mines:game",{"updatedAt":"2023-07-28T04:36:14.495Z","status":"lose","betAmount":10,"payout":0,"mineCount":20,"user":{"name":"Feeding The Geese","avatar":"https://avatars.steamstatic.com/8a34bc882f30728e1434dd6ec70a16be11e93ac6_full.jpg","totalWagered":97809,"xp":97809,"role":"user","id":657196,"steamId":"76561198153685135","isVerified":false}}]
 */

/**
 * General websocket events:
 *
 * Receive rain info: ["rain",{"pot":17995.8257}]
 * Receive lottery pot: ["lottery:pot",{"pot":483339.265}]
 * Receive Drops: ["drops",[{"item":{"name":"AK-47 | Point Disarray (Factory New)","image":"https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV08y5nY6fqPP9ILrDhGpI18l4jeHVu4702FLiqBA4MDv6JYHEIwRsNQ3Srwe-wu_t1pO76JrPyiNlu3Qh4X7D30vg5znacIE","price":2579,"ticketsEnd":29999,"ticketsStart":20000},"source":{"type":"battle","uri":"/cases/Medium-50-50","slug":"Medium-50-50","name":"Medium 50-50","image":"https://media.discordapp.net/attachments/1031237811577290833/1060636908260180008/Medium_50-50.png","price":1371}},{"item":{"name":"P250 | Valence (Well-Worn)","image":"https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopujwezhhwszYI2gS09-5mpSEguXLPr7Vn35cpp10j-uZrYqj3QLg-EE_YDr6JY7BcFA5YVyDq1LqwebthsC8uZybznp9-n51WXfLk64","price":7,"ticketsEnd":100000,"ticketsStart":83000},"source":{"type":"battle","uri":"/cases/Medium-50-50","slug":"Medium-50-50","name":"Medium 50-50","image":"https://media.discordapp.net/attachments/1031237811577290833/1060636908260180008/Medium_50-50.png","price":1371}}]]
 *
 * New chat message: ["chat:message",{"id":2101038,"room":"en","message":"RIP birdie","createdAt":"2023-07-28T04:27:10.080Z","removedById":null,"user":{"name":"BigCharles","avatar":"https://avatars.steamstatic.com/f8185b626ea89f32b249822f613957504515fc6f_full.jpg","totalWagered":41657,"xp":41657,"role":"user","id":635450,"steamId":"76561198436330880","isVerified":false}}]
 */

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