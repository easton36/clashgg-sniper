require('dotenv').config('../.env');

const Logger = require('./utils/logger.util');
const CONFIG = require('./config');

const ClashWebsocket = require('./websocket');
const { getAccessToken, getProfile } = require('./api');
const { newListingCreated, listingRemoved } = require('./listings');

async function main(){
	Logger.info('Starting the Clash.gg manager');

	// Getting the access token
	const accessToken = await getAccessToken(CONFIG.REFRESH_TOKEN, CONFIG.CF_CLEARANCE);
	if(!accessToken) return Logger.error('No access token was found');
	Logger.info(`Fetched access token: ${accessToken}`);

	// Getting the profile
	const profile = await getProfile();
	if(!profile) return Logger.error('No profile was found');
	Logger.info(`Fetched user profile! Name: ${profile.name}, User ID: ${profile.id}, Steam ID: ${profile.steamId}, Steam API Key: ${profile.steamApiKey}, Trade Token: ${profile.tradeToken}. \n\t\t\tTotal Deposits: ${profile.totalDeposits}, Total Withdrawals: ${profile.totalWithdrawals}, Total Wagered: ${profile.totalWagered}`);

	// Initializing the Clash.gg Websocket manager
	const instance = ClashWebsocket({
		accessToken,
		cfClearance: CONFIG.CF_CLEARANCE
	}, (event, data) => {
		switch(event){
		case 'auth':
			return Logger.info(`[WEBSOCKET] Successfully authenticated with the Clash.gg WebSocket server. User ID: ${data.userId}, Steam ID: ${data.steamId}, Role: ${data.role}`);

		case 'p2p:listing:new': return newListingCreated(data);
		case 'p2p:listing:remove': return listingRemoved(data);
		}
	});

	instance.initialize();
}

main();