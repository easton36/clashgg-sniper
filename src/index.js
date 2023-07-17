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
	createListing
} = require('./clash/api');
const {
	newListingCreated,
	listingRemoved,
	listingUpdated
} = require('./clash/listings');
const { itemPurchased, scriptStarted, listingCanceled } = require('./discord/webhook');
const { fetchAndInsertPricingData } = require('./pricempire/prices');

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

	const ourListings = {};

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

		for(const item of inventory){
			const askPrice = item?.price * CONFIG.INVENTORY_SELL_MARKUP_PERCENT;
			// create listing
			const listing = await createListing(item.externalId, askPrice);
			if(!listing) return;

			ourListings[listing.id] = listing;

			Logger.info(`Successfully listed item: ${item?.name} for $${askPrice / 100} coins!`);
		}
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

		case 'p2p:listing:new': {
			try{
				const shouldSnipe = newListingCreated(data);
				if(!shouldSnipe) return;
				// buy the listing
				const purchased = await buyListing(data.id);
				if(!purchased) return;

				// reduce account balance
				accountBalance -= data.item.askPrice;

				if(CONFIG.DISCORD_WEBHOOK_URL){
					// send webhook
					itemPurchased(CONFIG.DISCORD_WEBHOOK_URL, data);
				}
			} catch(err){
				accessToken = await getAccessToken(CONFIG.REFRESH_TOKEN, CONFIG.CF_CLEARANCE);
				// update websocket access token
				websocket.updateAccessToken(accessToken);

				Logger.info(`Regenerated access token: ${accessToken}`);
			}
			break;
		}
		case 'p2p:listing:remove': return listingRemoved(data);
		case 'p2p:listing:update': {
			const listingStatus = listingUpdated(data, steamId);
			if(listingStatus === 'CANCELED-SYSTEM' && CONFIG.DISCORD_WEBHOOK_URL){
				// send webhook
				listingCanceled(CONFIG.DISCORD_WEBHOOK_URL, data);
			}

			break;
		}
		}
	};

	return {
		initialize
	};
};

Manager().initialize();