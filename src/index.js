require('dotenv').config('../.env');

const Logger = require('./utils/logger.util');
const CONFIG = require('./config');

const ClashWebsocket = require('./clash/websocket');
const SteamAccount = require('./steam/account');
const MongoManager = require('./db/index');
const {
	getAccessToken,
	getProfile,
	buyListing,
	getSteamInventory,
	deleteListing,
	createListing,
	getActiveListings,
	answerListing
} = require('./clash/api');
const { itemPurchased, scriptStarted, listingCanceled } = require('./discord/webhook');
const { fetchAndInsertPricingData, fetchItemPrice } = require('./pricempire/prices');
const { checkDopplerPhase } = require('./pricempire/doppler');
const { formatListing } = require('./clash/helpers');

// Print all config settings in a nice column format
const startupMessage = () => {
	const configKeys = Object.keys(CONFIG);
	const longestKey = configKeys.reduce((a, b) => a.length > b.length ? a : b);

	let message = 'Starting the Clash.gg manager. Config Settings:\n';

	for(const key of configKeys){
		const value = CONFIG[key];
		const spaces = ' '.repeat(longestKey.length - key.length + 1);

		message += `\t\t${key}:${spaces}${value}\n`;
	}

	return message;
};

const Manager = () => {
	Logger.verbose(startupMessage());

	const startTime = new Date();

	let accessToken;
	let websocket;
	let steamAccount;
	let steamId;
	let accountBalance = 0;

	let enableSniping = CONFIG.ENABLE_ITEM_SNIPING;

	const ourListings = {};
	const listedItems = [];
	// store timeouts for sent trade cancels
	const sentTradeCancelTimeouts = {};

	const listingsToWatch = {};

	/**
	 * Sends a message to the console every hour to let us know the script is still running
	 */
	const _aliveStatusUpdate = () => {
		const timeElapsed = new Date() - startTime;
		const timeElapsedHours = Math.floor(timeElapsed / 1000 / 60 / 60);

		Logger.info(`The Clash.gg manager has been running for ${timeElapsedHours} hours. It is currently ${new Date().toLocaleString()}, and we started at ${startTime.toLocaleString()}`);

		// RE-fetching the pricing data every hour
		if(CONFIG.PRICEMPIRE_API_KEY){
			fetchAndInsertPricingData(CONFIG.PRICEMPIRE_API_KEY);
		}
	};

	/**
	 * Initializes the Clash.gg manager
	 */
	const initialize = async () => {
		// We run this once an hour to just give time notice
		setInterval(_aliveStatusUpdate, 1000 * 60 * 60); // 1 hour

		// Initializing the database if enabled
		if(CONFIG.PRICEMPIRE_API_KEY){
			await MongoManager.connect();
			await fetchAndInsertPricingData(CONFIG.PRICEMPIRE_API_KEY);
		}

		await generateAccessToken();
		await fetchProfile();

		// Initializing the Steam account
		if(CONFIG.ENABLE_STEAM_LOGIN){
			steamAccount = SteamAccount({
				username: CONFIG.STEAM_USERNAME,
				password: CONFIG.STEAM_PASSWORD,
				sharedSecret: CONFIG.STEAM_SHARED_SECRET,
				identitySecret: CONFIG.STEAM_IDENTITY_SECRET
			});

			await steamAccount.login();
		}

		// Initializing the Clash.gg Websocket manager
		websocket = ClashWebsocket({
			accessToken,
			cfClearance: CONFIG.CF_CLEARANCE
		}, _websocketCallback);

		// Sending the script started webhook
		if(CONFIG.DISCORD_WEBHOOK_URL){
			scriptStarted(CONFIG.DISCORD_WEBHOOK_URL);
		}

		if(CONFIG.ENABLE_BULK_SELL){
			// Fetch all active listings
			const activeListings = await getActiveListings();
			for(const listing of activeListings){
				ourListings[listing.id] = listing;
				listedItems.push(listing.item.externalId);
			}
			// List all items in inventory on Clash
			await listAllItems();
		}
	};

	/**
	 * Generates a new access token
	 */
	const generateAccessToken = async () => {
		accessToken = await getAccessToken(CONFIG.REFRESH_TOKEN, CONFIG.CF_CLEARANCE);
		if(!accessToken){
			return Logger.error('No access token was found');
		}

		Logger.info(`Fetched access token: ${accessToken}`);

		if(websocket){
			// update websocket access token
			websocket.updateAccessToken(accessToken);
		}
	};

	/**
	 * Fetches the clash profile
	 */
	const fetchProfile = async () => {
		// Getting the profile
		const profile = await getProfile();
		if(!profile) return Logger.error('No profile was found');

		const profileKeys = ['id', 'name', 'steamId', 'balance', 'role', 'kycStatus', 'totalDeposits', 'totalWithdrawals', 'totalWagered', 'affiliateCode', 'createdAt'];
		const longestKey = profileKeys.reduce((a, b) => a.length > b.length ? a : b);

		let message = 'Fetched user profile!\n';

		for(const key of profileKeys){
			const value = profile[key];
			const spaces = ' '.repeat(longestKey.length - key.length + 1);

			message += `\t\t${key}:${spaces}${value}\n`;
		}

		Logger.info(message);
		steamId = profile.steamId;
		accountBalance = profile.balance;
	};

	/**
	 * List all items in inventory on Clash
	 */
	const listAllItems = async () => {
		const inventory = await getSteamInventory();
		if(!inventory) return Logger.error('No inventory was found');
		// filter inventory for items that have not been listed
		const filteredInventory = inventory.filter(item => {
			const alreadyListed = listedItems.includes(item.externalId);

			return !alreadyListed && item.isAccepted && item.isTradable;
		});
		// list all items in filteredInventory
		for(const item of filteredInventory){
			const askPrice = item?.price * CONFIG.INVENTORY_SELL_MARKUP_PERCENT;
			// create listing
			const listing = await createListing(item.externalId, askPrice);
			if(!listing) return;

			ourListings[listing.id] = listing;
			listedItems.push(item.externalId);

			Logger.info(`Successfully listed item: ${item?.name} for $${askPrice / 100} coins!`);
		}
	};

	/**
	 * Modify current balance and take action if needed
	 * @param {Number} balanceChange - The amount to change the balance by
	 */
	const modifyBalance = async (balanceChange) => {
		accountBalance += balanceChange;

		if(accountBalance < CONFIG.MIN_PRICE){
			Logger.error(`Account balance is currently ${accountBalance}, too low to snipe anything. Disabling sniping...`);

			enableSniping = false;
		}
	};

	/**
	 * Create a timeout to cancel a sent trade
	 * @param {String} listingId - The ID of the listing
	 * @param {Object} offer - The offer object
	 * @param {Date} expiresAt - The date the offer expires at
	 */
	const createSentTradeCancelTimeout = (listingId, offer, expiresAt) => {
		// expires at - 30 seconds
		const timeUntilExpiration = expiresAt - new Date() - (1000 * 30);
		const timeout = setTimeout(async () => {
			Logger.info(`[TIMEOUT] Cancelling sent trade for listing ID: ${listingId}, offer ID: ${offer.id}`);

			// cancel trade with offer id
			const canceled = await steamAccount.cancelOffer(offer);
			if(!canceled) return;

			Logger.info(`[TIMEOUT] Successfully cancelled sent trade for listing ID: ${listingId}, offer ID: ${offer.id}`);

			// delete timeout
			delete sentTradeCancelTimeouts[listingId];
		}, timeUntilExpiration);

		sentTradeCancelTimeouts[listingId] = timeout;
	};

	/**
	 * Websocket callback for the Clash.gg manager
	 * @param {String} event - The event of the websocket
	 * @param {Object} data - The data of the websocket
	 */
	const _websocketCallback = async (event, data) => {
		switch(event){
		case 'auth':
			return Logger.info(`[WEBSOCKET] Successfully authenticated with the Clash.gg WebSocket server. User ID: ${data.userId}, Steam ID: ${data.steamId}, Role: ${data.role}`);

		case 'p2p:listing:new': return _newListingCreated(data);
		case 'p2p:listing:remove': return _listingRemoved(data);
		case 'p2p:listing:update': return _listingUpdated(data);
		}
	};

	/**
	 * When a new p2p listing is created
	 * @param {Object} data - The data of the p2p listing
	 * @returns {Boolean} Whether or not the listing was purchased
	 */
	const _newListingCreated = async (data) => {
		try{
			if(!enableSniping) return false;

			const { item } = data;
			// check if we can afford the item
			if(data?.item?.askPrice > accountBalance){
				Logger.warn(`[WEBSOCKET] Received new p2p listing, but it was ignored due to INSUFFICIENT BALANCE. Current Balance: ${accountBalance}, ${formatListing(data)}`);
			}

			const markupPercentage = item?.askPrice / item?.price;

			const dopplerPhase = checkDopplerPhase(item.imageUrl);
			// check if meets criteria
			const containsStringToIgnore = CONFIG.STRINGS_TO_IGNORE.some(string => item?.name.toLowerCase().includes(string.toLowerCase()));
			if(
				item?.askPrice < CONFIG.MIN_PRICE ||
				item?.askPrice > CONFIG.MAX_PRICE ||
				CONFIG.ITEMS_TO_IGNORE.includes(item?.name) || markupPercentage > CONFIG.MAX_MARKUP_PERCENT || containsStringToIgnore ||
				(CONFIG.CHECK_BUFF_PRICE && dopplerPhase) // if item has a doppler phase, we should also check buff price... could be a good deal!
			){
				Logger.info(`[WEBSOCKET] Received new p2p listing, but it was ignored. ${formatListing(data, 'ignored')}`);

				return false;
			}

			let extraData = {};
			if(CONFIG.CHECK_BUFF_PRICE){
				const priceData = await fetchItemPrice(item.name);
				if(!priceData) return false;
				// calculate buff percentage, convert askPrice to USD
				const askPriceUSD = item.askPrice * CONFIG.CLASH_COIN_CONVERSION;
				// if we have a doppler phase use that specific buff price
				const buffPrice = priceData?.prices[dopplerPhase ? `buff163_${dopplerPhase}` : 'buff163'];
				const buffPercentage = askPriceUSD / buffPrice;

				extraData = { buffPrice, buffPercentage, askPriceUSD };

				// check if buff percentage is greater than max buff percentage
				if(buffPercentage > CONFIG.MAX_BUFF_PERCENT){
					Logger.info(`[WEBSOCKET] Received new p2p listing, but it was ignored. ${formatListing(data, 'buff', extraData)}`);

					return false;
				}
			}

			listingsToWatch[data.id] = data;
			Logger.info(`[WEBSOCKET] Received new p2p listing to SNIPE. ${formatListing(data, 'buff', extraData)}`);

			// buy the listing
			const purchased = await buyListing(data.id);
			if(!purchased) return false;

			// reduce account balance
			modifyBalance(-data.item.askPrice);

			if(CONFIG.DISCORD_WEBHOOK_URL){
				// send webhook
				itemPurchased(CONFIG.DISCORD_WEBHOOK_URL, data);
			}

			return true;
		} catch(err){
			Logger.error(`[WEBSOCKET] An error occurred while processing a new p2p listing: ${err.message || err}`);
			generateAccessToken();
		}
	};

	/**
	 * When a p2p listing is removed
	 * @param {Object} data - The data of the p2p listing
	 * @returns {void}
	 */
	const _listingRemoved = (data) => {
		const listing = listingsToWatch[data.id];
		if(!listing) return;

		delete listingsToWatch[data.id];

		return Logger.info(`[WEBSOCKET] A p2p listing we were watching was removed. ${formatListing(listing)}`);
	};

	/**
	 * Process a sell order that we asked to sell
	 * @param {Object} data - The data of the p2p listing
	 */
	const _processSellOrderAsked = async (data) => {
		Logger.info(`[WEBSOCKET] We ASKED to sell a p2p listing. ${formatListing(data)}`);
		// update listing
		ourListings[data.id] = data;
		// answer listing
		await answerListing(data.id);
	};

	/**
	 * Send a trade offer to the seller
	 * @param {Object} data - The data of the p2p listing
	 */
	const _processSellOrderAnswered = async (data) => {
		Logger.info(`[WEBSOCKET] We ANSWERED to sell a p2p listing. ${formatListing(data)}`);
		// update listing
		ourListings[data.id] = data;
		// get info needed to send trade
		const buyerTradelink = data?.buyerTradelink;
		const [appid, contextid, assetid] = data?.item?.externalId.split('|');
		// send trade
		const offer = steamAccount.sendOffer(buyerTradelink, {
			appid,
			contextid,
			assetid,
			name: data?.item?.name
		});
		// create timeout to cancel trade
		if(offer){
			createSentTradeCancelTimeout(data.id, offer, data?.stepExpiresAt);
		} else{ // if we couldn't send the offer, cancel the listing
			Logger.error(`[WEBSOCKET] We were ASKED to sell a p2p listing, but we could not send the trade. DELETING LISTING... ${formatListing(data)}`);

			await deleteListing(data.id);
		}
	};

	/**
	 * When a p2p listing is updated
	 * @param {Object} data - The data of the p2p listing
	 * @returns {String} The status of the p2p listing
	 */
	const _listingUpdated = (data) => {
		const listingStatus = data?.status;

		const sellerSteamId = data?.seller?.steamId;

		switch(listingStatus){
		case 'ASKED': {
			if(sellerSteamId === steamId){
				return _processSellOrderAsked(data);
			} else{
				Logger.info(`[WEBSOCKET] We ASKED to purchase a p2p listing. ${formatListing(data)}`);
			}
			break;
		}
		case 'CANCELED-SYSTEM': {
			if(CONFIG.DISCORD_WEBHOOK_URL){
				// send webhook
				listingCanceled(CONFIG.DISCORD_WEBHOOK_URL, data);
			}

			Logger.warn(`[WEBSOCKET] A p2p listing we asked to purchase was CANCELED by the system. ${formatListing(data)}`);
			break;
		}
		// seller has accepted our offer
		case 'ANSWERED': {
			if(sellerSteamId === steamId){
				return _processSellOrderAnswered(data);
			} else{
				Logger.info(`[WEBSOCKET] We ASKED to purchase a p2p listing. ${formatListing(data)}`);
			}
			Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was ACCEPTED by the seller. ${formatListing(data)}`);
			break;
		}
		// seller has sent the steam trade
		case 'SENT':
			if(sellerSteamId === steamId){
				Logger.info(`[WEBSOCKET] We SENT a p2p listing we sold. ${formatListing(data)}`);
			} else{
				Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was SENT by the seller. ${formatListing(data)}`);
			}
			break;

		// we accepted the steam trade
		case 'RECEIVED':
			if(sellerSteamId === steamId){
				Logger.info(`[WEBSOCKET] The buyer RECEIVED a p2p listing we sold. ${formatListing(data)}`);
			} else{
				Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was RECEIVED by us. ${formatListing(data)}`);
			}
			break;

		default:
			Logger.info(`[WEBSOCKET] Received unknown status ${listingStatus} for p2p listing. ${formatListing(data)}`);
		}

		return listingStatus;
	};

	return {
		initialize
	};
};

Manager().initialize();