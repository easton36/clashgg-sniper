const axios = require('axios');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'User-Agent': CONFIG.USER_AGENT,
	Accept: '*/*',
	'Accept-Encoding': 'gzip, deflate, br',
	'Accept-Language': 'en-US,en;q=0.9'
};

const instance = axios.create({
	baseURL: CONFIG.CLASH_API_URL,
	headers: DEFAULT_HEADERS
});

/**
 * This doesn't implement CRASH functionality because it is WEBSOCKET only
 * Route: wss://gs.clash.gg/
 * To place a bet (SEND): ["placeBet",{"amount":10,"autoCashoutAt":50}]
 *
 * To fetch my bets (SEND): ["myBets",null]
 * My bets response: ["myBets",[{"amount":10,"user":{"id":673033,"avatar":"https://avatars.steamstatic.com/ac2c06bdd9e05d683b98ec81278c5332ec7380d8_full.jpg","name":"Shing bala","level":0},"betId":55331601,"state":"active","autoCashoutAt":50}]]
 *
 * New user bet: ["bet",{"amount":50,"user":{"id":550416,"avatar":"/assets/csgo/avatar-anonymous.png","name":"CrazyClasher","level":0},"betId":55331640,"state":"active","autoCashoutAt":50}]
 *
 * Server tick: ["tick",{"elapsed":3152,"at":1.2,"cashouts":[{"betId":55331634,"at":1.2}]}]
 *
 * Server time ping (SEND): ["ping:serverTime",null]
 * Server time ping response: ["ping:serverTime",1690518543939]
 *
 * Server ping (SEND): ["ping:pong",1690518543939]
 * Server ping response: ["ping:pong",159]
 *
 * Game status: ["status",{"gameId":32510,"state":"ended","bets":[{"amount":10,"user":{"id":692869,"avatar":"https://avatars.steamstatic.com/2b031c9c276aa149b700050ed329c93e5898e365_full.jpg","name":"spook.shake","level":0},"betId":55331755,"state":"lost","autoCashoutAt":5000},{"amount":50,"user":{"id":550416,"avatar":"/assets/csgo/avatar-anonymous.png","name":"CrazyClasher","level":0},"betId":55331759,"state":"lost","autoCashoutAt":1.3},{"amount":10000,"user":{"id":433293,"avatar":"https://avatars.steamstatic.com/e9fbd1a9ea469b02c586247bc37b2949e3fa4617_full.jpg","name":"advanceddsinc","level":0},"betId":55331760,"state":"lost","autoCashoutAt":50},{"amount":600,"user":{"id":342320,"avatar":"https://avatars.steamstatic.com/6f70df36b5f35d784cbe565e6fcf084e5f20f085_full.jpg","name":"hina","level":0},"betId":55331763,"state":"lost","autoCashoutAt":2},{"amount":884,"user":{"id":588487,"avatar":"https://avatars.steamstatic.com/ef0a1d3e7fca48c6e2efa8f064768e70c97c56c8_full.jpg","name":"Alien Cat","level":0},"betId":55331764,"state":"lost","autoCashoutAt":500},{"amount":10,"user":{"id":471666,"avatar":"https://avatars.steamstatic.com/f3d05db4d8557efbcdbfb337f4176abe9fcb5c1b_full.jpg","name":"ImpactHills","level":0},"betId":55331767,"state":"lost","autoCashoutAt":50}],"startedAt":1690518543582,"now":1690518544633,"at":1.06}]
 * Game status 2: ["status",{"gameId":32511,"state":"in-progress","bets":[{"amount":884,"user":{"id":588487,"avatar":"https://avatars.steamstatic.com/ef0a1d3e7fca48c6e2efa8f064768e70c97c56c8_full.jpg","name":"Alien Cat","level":0},"betId":55331790,"state":"active","autoCashoutAt":500},{"amount":5004,"user":{"id":12,"avatar":"https://avatars.steamstatic.com/fbeb30f73f7b1f762e4b70e2c410881090d51c69_full.jpg","name":"Zuccy #rustclash #clashgg","level":0},"betId":55331792,"state":"active","autoCashoutAt":2.25},{"amount":10,"user":{"id":692869,"avatar":"https://avatars.steamstatic.com/2b031c9c276aa149b700050ed329c93e5898e365_full.jpg","name":"spook.shake","level":0},"betId":55331795,"state":"active","autoCashoutAt":5000},{"amount":10000,"user":{"id":433293,"avatar":"https://avatars.steamstatic.com/e9fbd1a9ea469b02c586247bc37b2949e3fa4617_full.jpg","name":"advanceddsinc","level":0},"betId":55331796,"state":"active","autoCashoutAt":50},{"amount":20,"user":{"id":471666,"avatar":"https://avatars.steamstatic.com/f3d05db4d8557efbcdbfb337f4176abe9fcb5c1b_full.jpg","name":"ImpactHills","level":0},"betId":55331822,"state":"active","autoCashoutAt":50},{"amount":1500,"user":{"id":342320,"avatar":"https://avatars.steamstatic.com/6f70df36b5f35d784cbe565e6fcf084e5f20f085_full.jpg","name":"hina","level":0},"betId":55331823,"state":"active","autoCashoutAt":2},{"amount":50,"user":{"id":550416,"avatar":"/assets/csgo/avatar-anonymous.png","name":"CrazyClasher","level":0},"betId":55331828,"state":"active","autoCashoutAt":1.3}],"startedAt":1690518559638,"now":1690518559638}]
 *
 * Game history entry: ["historyEntry",{"crashedAt":1.06,"id":32510,"seed":"aba10874e0a48a382b32cfe22f9bb38cbe5fae8ad20d9b58ffda5e788fbe1a03"}]
 */

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
 * Handles API responses
 * @param {Object} response - The API response
 * @param {String} successCondition - The condition that needs to be met for the operation to be considered successful
 * @param {String} errorMessage - The error message for the Logger
 * @param {Function} callback - The callback function to call if the operation was successful
 * @returns {Object|boolean} Returns the response data if successful, else false
 */
const handleResponse = (response, successCondition, errorMessage, callback) => {
	if(!successCondition){
		Logger.error(`[API] ${errorMessage}: ${response?.data?.message}`);
		if(!response?.data?.message){
			console.log(response?.data);
		}

		return false;
	}

	if(callback){
		callback();
	}

	return response?.data;
};

/**
 * Handles request errors
 * @param {Error} err - The error object
 * @param {String} errorMessage - The error message for the Logger
 * @returns {boolean} Always returns false
 */
const handleError = (err, errorMessage) => {
	const errMessage = err?.response?.data?.message || err.message || err;
	Logger.error(`[API] ${errorMessage}: ${errMessage}`);

	// if we are Unauthorized, we need to get a new access token
	if(errMessage === 'Unauthorized'){
		throw new Error('Unauthorized');
	}

	return false;
};

/**
 * Gets a Clash.gg access token
 * @param {String} refreshToken - The refresh token for the Clash.gg access token
 * @param {String} cfClearance - The cf_clearance cookie for the Clash.gg access token
 * @returns {Promise<String>} The Clash.gg access token
 * @throws {Error} The error which occurred
 */
const getAccessToken = async (refreshToken, cfClearance) => {
	try{
		const response = await instance.get('/auth/access-token', {
			headers: {
				...DEFAULT_HEADERS,
				Cookie: `cf_clearance=${cfClearance}; refresh_token=${refreshToken}`
			}
		});

		const accessToken = response?.data?.accessToken;
		if(!accessToken){
			throw new Error('No access token was found');
		}

		// set the cf_clearance cookie
		instance.defaults.headers.Cookie = `cf_clearance=${cfClearance}; refresh_token=${refreshToken}`;
		// set the access token as the authorization header
		instance.defaults.headers.Authorization = `Bearer ${accessToken}`;

		return accessToken;
	} catch(err){
		return handleError(err, 'An error occurred while getting the access token');
	}
};

/**
 * Fetches Clash.gg profile
 * @returns {Promise<Object>} The profile
 * @throws {Error} The error which occurred
 */
const getProfile = async () => {
	const errorMessage = 'An error occurred while getting the profile';
	try{
		const response = await instance.get('/user/me');

		return handleResponse(response, response?.data?.id, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Fetches Clash.gg user notifications
 */
const getNotifications = async () => {
	const errorMessage = 'An error occurred while getting the notifications';
	try{
		const response = await instance.get('/user/notifications');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Fetches Clash.gg active listings
 * @returns {Promise<Object>} The listings
 */
const getActiveListings = async () => {
	const errorMessage = 'An error occurred while getting the active listings';
	try{
		const response = await instance.get('/steam-p2p/listings/my-active');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Fetches all items listed on Clash.gg
 * @returns {Promise<Object[]>} The items
 */
const getAllListedItems = async () => {
	const errorMessage = 'An error occurred while getting all listed items';
	try{
		const response = await instance.get('/steam/shop');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Buys a Clash.gg listing
 * @param {String} listingId - The ID of the listing to buy
 * @returns {Promise<Boolean>} Whether or not the listing was bought
 */
const buyListing = async (listingId) => {
	const errorMessage = `An error occurred while buying the listing (${listingId})`;
	try{
		const response = await instance({
			method: 'PATCH',
			url: `/steam-p2p/listings/${listingId}/buy`
		});

		return handleResponse(response, response?.data?.success, errorMessage, () => {
			Logger.info(`[API] Successfully bought the listing (${listingId})! New site balance: ${response?.data?.newBalance}`);
		});
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Fetches Clash.gg steam inventory
 * @returns {Promise<Object>} The steam inventory
 */
const getSteamInventory = async () => {
	const errorMessage = 'An error occurred while getting the steam inventory';
	try{
		const response = await instance.get('/steam/inventory');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Deletes a Clash.gg listing
 * @param {String} listingId - The ID of the listing to delete
 * @returns {Promise<Boolean>} Whether or not the listing was deleted
 */
const deleteListing = async (listingId) => {
	const errorMessage = `An error occurred while deleting the listing (${listingId})`;
	try{
		const response = await instance({
			method: 'DELETE',
			url: `/steam-p2p/listings/${listingId}`
		});

		return handleResponse(response, response?.data?.success, errorMessage, () => {
			Logger.info(`[API] Successfully deleted the listing (${listingId})`);
		});
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Creates a Clash.gg listing
 * @param {String} externalId - The externalId of the item to list
 * @param {Number} price - The price of the item to list
 * @returns {Promise<Object>} The listing
 */
const createListing = async (externalId, price) => {
	const errorMessage = `An error occurred while creating the listing (${externalId})`;
	try{
		const response = await instance({
			method: 'POST',
			url: '/steam-p2p/listings',
			data: {
				items: [{
					externalId,
					askPrice: price
				}]
			}
		});

		return handleResponse(response, response?.data[0]?.status === 'OPEN', errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Answers a Clash.gg listing asking to sell an item
 * @param {String} listingId - The ID of the listing to answer
 * @returns {Promise<Boolean>} Whether or not the listing was answered
 */
const answerListing = async (listingId) => {
	const errorMessage = `An error occurred while answering the listing (${listingId})`;
	try{
		const response = await instance({
			method: 'PATCH',
			url: `/steam-p2p/listings/${listingId}/answer`
		});

		return handleResponse(response, response?.data?.listing?.status === 'ANSWERED', errorMessage, () => {
			Logger.info(`[API] Successfully answered the listing (${listingId})`);
		});
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Tells clash.gg that we are still online
 * @returns {Promise<Object>} The response
 */
const steamP2pOnline = async () => {
	const errorMessage = 'An error occurred while telling Clash.gg we are still online';
	try{
		const response = await instance({
			method: 'POST',
			url: '/steam-p2p/online'
		});

		return handleResponse(response, response?.data?.success, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Opens a free case on Clash.gg
 * @param {String} clientSeed - The client seed to use
 * @param {String} caseSlug - The slug of the case to open
 * @returns {Promise<Object>} The case
 */
const openCase = async (clientSeed, caseSlug) => {
	const errorMessage = `An error occurred while opening the case (${caseSlug})`;
	try{
		const response = await instance({
			method: 'POST',
			url: '/cases/open',
			data: {
				amount: 1,
				slug: caseSlug,
				clientSeed
			}
		});

		return handleResponse(response, response?.data?.total === 1, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets all cases on Clash.gg
 * @returns {Promise<Object>} The cases
 */
const getCases = async () => {
	const errorMessage = 'An error occurred while getting all cases';
	try{
		const response = await instance.get('/cases');

		return handleResponse(response, response?.data?.length > 0, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets case details on Clash.gg
 * @param {String[]} caseSlugs - The slugs of the cases to get details for
 * @returns {Promise<Object>} The case details
 */
const getCaseDetails = async (caseSlugs) => {
	const errorMessage = 'An error occurred while getting the case details';
	try{
		const response = await instance.get(`/cases/details/?slugs=${caseSlugs.join(',')}`);

		return handleResponse(response, response?.data?.length > 0, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets all free case cooldowns on Clash.gg
 * @returns {Promise<Object>} The free case cooldowns
 */
const getFreeCaseCooldowns = async () => {
	const errorMessage = 'An error occurred while getting all free case cooldowns';
	try{
		const response = await instance.get('/cases/level-cooldown/all');

		return handleResponse(response, response?.data?.length > 0, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets recent case drops on Clash.gg
 * @returns {Promise<Object[]>} The recent case drops
 */
const getRecentCaseDrops = async () => {
	const errorMessage = 'An error occurred while getting the recent case drops';
	try{
		const response = await instance.get('/cases/recent-drops');

		return handleResponse(response, response?.data?.length > 0, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets clash.gg server hash
 * @returns {Promise<Object>} The server hash
 */
const getServerHash = async () => {
	const errorMessage = 'An error occurred while getting the server hash';
	try{
		const response = await instance.get('/fairness/server-hash');

		return handleResponse(response, response?.data?.serverHash, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets clash.gg rain pot
 * @returns {Promise<Object>} The rain pot
 */
const getRainPot = async () => {
	const errorMessage = 'An error occurred while getting the rain pot';
	try{
		const response = await instance.get('/rain');

		return handleResponse(response, response?.data?.pot, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Check if we are participating in a rain pot
 * @returns {Promise<Object>} The rain pot
 */
const checkRainParticipation = async () => {
	const errorMessage = 'An error occurred while checking if we are participating in a rain pot';
	try{
		const response = await instance.get('/rain/is-participating');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Checks if you are IP locked on Clash.gg
 * @returns {Promise<Object>} The IP lock
 */
const checkIpLock = async () => {
	const errorMessage = 'An error occurred while checking if you are IP locked';
	try{
		const response = await instance.get('/ip-lock');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets Clash.gg wager requirement
 * @returns {Promise<Object>} The wager requirement
 */
const getWagerRequirement = async () => {
	const errorMessage = 'An error occurred while getting the wager requirement';
	try{
		const response = await instance.get('/wager-requirement');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets Clash.gg cashout availability
 * @returns {Promise<Object>} The cashout availability
 */
const getCashoutAvailability = async () => {
	const errorMessage = 'An error occurred while getting the cashout availability';
	try{
		const response = await instance.get('/payments/cashout-availability');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets Clash.gg affiliate information
 * @returns {Promise<Object>} The affiliate information
 */
const getAffiliateInfo = async () => {
	const errorMessage = 'An error occurred while getting the affiliate information';
	try{
		const response = await instance.get('/affiliates');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets Clash.gg affiliate cooldown
 * @returns {Promise<Object>} The affiliate cooldown
 */
const getAffiliateCooldown = async () => {
	const errorMessage = 'An error occurred while getting the affiliate cooldown';
	try{
		const response = await instance.get('/affiliates/cooldown');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Get current roulette game
 * @returns {Object} data - The current roulette game
 */
const getRouletteGame = async () => {
	const errorMessage = 'An error occurred while getting the current roulette game';
	try{
		const response = await instance.get('/roulette/current');

		return handleResponse(response, response?.data?.status === 'OPEN', errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Place a roulette bet
 * @param {String} option - The option to bet on. "RED", "GREEN", "BLACK", "BAIT"
 * @param {Number} amount - The amount to bet (in cents)
 * @param {Number} gameId - The game ID to bet on
 * @returns {Promise<Object>} The bet
 */
const placeRouletteBet = async (option, amount, gameId) => {
	const errorMessage = `An error occurred while placing the roulette bet $${amount / 100} on ${option} in game ${gameId}`;
	try{
		const response = await instance({
			method: 'POST',
			url: '/roulette/bet',
			data: {
				option,
				amount,
				gameId
			}
		});

		return handleResponse(response, response?.data?.success, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Get active battles
 * @returns {Promise<Object>} The active battles
 */
const getActiveBattles = async () => {
	const errorMessage = 'An error occurred while getting the active battles';
	try{
		const response = await instance.get('/battles/active');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Get private battles
 * @returns {Promise<Object>} The private battles
 */
const getPrivateBattles = async () => {
	const errorMessage = 'An error occurred while getting the private battles';
	try{
		const response = await instance.get('/battles/private');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Create a battle
 * @param {Object[]} cases - The cases to use in the battle
 * @param {Boolean} isAffiliateOnly - Whether or not the battle is affiliate only
 * @param {Boolean} isPrivate - Whether or not the battle is private
 * @param {Number} minLevel - The minimum level to join the battle
 * @param {String} mode - The mode of the battle
 * @param {String} type - The type of the battle
 * @returns {Promise<Object>} The battle
 */
const createBattle = async (cases, isAffiliateOnly = false, isPrivate = false, minLevel = 0, mode = 'normal', type = '1v1') => {
	const errorMessage = 'An error occurred while creating the battle';
	try{
		const response = await instance({
			method: 'POST',
			url: '/battles',
			data: {
				cases,
				isAffiliateOnly,
				isPrivate,
				minLevel,
				mode,
				type
			}
		});

		return handleResponse(response, response?.data?.battle?.state === 'open', errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Get specific battle details
 * @param {String} battleId - The ID of the battle to get details for
 * @returns {Promise<Object>} The battle details
 */
const getBattleDetails = async (battleId) => {
	const errorMessage = 'An error occurred while getting the battle details';
	try{
		const response = await instance.get(`/battles/${battleId}/details`);

		return handleResponse(response, response?.data?.id, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Get unclaimed upgrader items
 * @returns {Promise<Object[]>} The unclaimed upgrader items
 */
const getUnclaimedUpgraderItems = async () => {
	const errorMessage = 'An error occurred while getting the unclaimed upgrader items';
	try{
		const response = await instance.get('/upgrader/unclaimed');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

module.exports = {
	getAccessToken,
	getProfile,
	getNotifications,
	getActiveListings,
	getAllListedItems,

	getSteamInventory,
	steamP2pOnline,

	buyListing,
	deleteListing,
	createListing,
	answerListing,

	openCase,
	getCases,
	getCaseDetails,
	getFreeCaseCooldowns,
	getRecentCaseDrops,

	getServerHash,
	getRainPot,
	checkRainParticipation,
	checkIpLock,

	getWagerRequirement,
	getCashoutAvailability,

	getAffiliateInfo,
	getAffiliateCooldown,

	getRouletteGame,
	placeRouletteBet,

	getActiveBattles,
	getPrivateBattles,
	createBattle,
	getBattleDetails,

	getUnclaimedUpgraderItems
};