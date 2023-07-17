require('dotenv').config('../.env');

const Logger = require('./utils/logger.util');
const CONFIG = require('./config');

const ClashWebsocket = require('./clash/websocket');
const SteamAccount = require('./steam/account');
const { getAccessToken, getProfile, buyListing } = require('./clash/api');
const { newListingCreated, listingRemoved, listingUpdated } = require('./clash/listings');
const { itemPurchased, scriptStarted, listingCanceled } = require('./discord/webhook');

const startTime = new Date();
// We run this once an hour to just give time notice
setInterval(() => {
	const timeElapsed = new Date() - startTime;
	const timeElapsedHours = Math.floor(timeElapsed / 1000 / 60 / 60);
	Logger.info(`The Clash.gg manager has been running for ${timeElapsedHours} hours. It is currently ${new Date().toLocaleString()}, and we started at ${startTime.toLocaleString()}`);
}, 1000 * 60 * 60); // 1 hour

async function main(){
	Logger.info(`Starting the Clash.gg manager. Version: ${CONFIG.VERSION}, Minimum Item Price: ${CONFIG.MIN_PRICE / 100}, Maximum Item Price: ${CONFIG.MAX_PRICE / 100}, Maximum Markup Percentage: ${CONFIG.MAX_MARKUP_PERCENT}, Items to Ignore: ${CONFIG.ITEMS_TO_IGNORE.join(', ') || 'N/A'}, Strings to Ignore: ${CONFIG.STRINGS_TO_IGNORE.join(', ') || 'N/A'}`);

	// Getting the access token
	const accessToken = await getAccessToken(CONFIG.REFRESH_TOKEN, CONFIG.CF_CLEARANCE);
	if(!accessToken) return Logger.error('No access token was found');
	Logger.info(`Fetched access token: ${accessToken}`);

	// Getting the profile
	const profile = await getProfile();
	if(!profile) return Logger.error('No profile was found');
	Logger.info(`Fetched user profile! Name: ${profile.name}, User ID: ${profile.id}, Steam ID: ${profile.steamId}, Current Balance: ${profile.balance}. \n\t\t\tTotal Deposits: ${profile.totalDeposits}, Total Withdrawals: ${profile.totalWithdrawals}, Total Wagered: ${profile.totalWagered}`);

	// Initializing the Steam account
	if(CONFIG.ENABLE_STEAM_LOGIN){
		const steamAccount = SteamAccount({
			username: CONFIG.STEAM_USERNAME,
			password: CONFIG.STEAM_PASSWORD,
			sharedSecret: CONFIG.STEAM_SHARED_SECRET,
			identitySecret: CONFIG.STEAM_IDENTITY_SECRET
		});

		await steamAccount.login();
	}

	// Initializing the Clash.gg Websocket manager
	ClashWebsocket({
		accessToken,
		cfClearance: CONFIG.CF_CLEARANCE
	}, async (event, data) => {
		switch(event){
		case 'auth':
			return Logger.info(`[WEBSOCKET] Successfully authenticated with the Clash.gg WebSocket server. User ID: ${data.userId}, Steam ID: ${data.steamId}, Role: ${data.role}`);

		case 'p2p:listing:new': {
			const shouldSnipe = newListingCreated(data);
			if(!shouldSnipe) return;
			// buy the listing
			const purchased = await buyListing(data.id);

			if(CONFIG.DISCORD_WEBHOOK_URL && purchased){
				// send webhook
				itemPurchased(CONFIG.DISCORD_WEBHOOK_URL, data);
			}
			break;
		}
		case 'p2p:listing:remove': return listingRemoved(data);
		case 'p2p:listing:update': {
			const listingStatus = listingUpdated(data);
			if(listingStatus === 'CANCELED-SYSTEM' && CONFIG.DISCORD_WEBHOOK_URL){
				// send webhook
				listingCanceled(CONFIG.DISCORD_WEBHOOK_URL, data);
			}
		}
		}
	});

	// Sending the script started webhook
	if(CONFIG.DISCORD_WEBHOOK_URL){
		scriptStarted(CONFIG.DISCORD_WEBHOOK_URL);
	}
}

main();