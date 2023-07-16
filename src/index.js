require('dotenv').config('../.env');

const Logger = require('./utils/logger.util');
const CONFIG = require('./config');

const ClashWebsocket = require('./websocket');
const { getAccessToken, getProfile } = require('./api');

const ACTIVE_LISTINGS = {};

async function main(){
	Logger.info('Starting the Clash.gg manager');

	// Getting the access token
	const accessToken = await getAccessToken(CONFIG.REFRESH_TOKEN, CONFIG.CF_CLEARANCE);
	if(!accessToken) return Logger.error('No access token was found');
	Logger.info(`Fetched access token: ${accessToken}`);

	// Getting the profile
	const profile = await getProfile(accessToken);
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
			case 'p2p:listing:new':
				ACTIVE_LISTINGS[data.id] = data;

				return Logger.info(`[WEBSOCKET] Received new p2p listing. ID: ${data.id}, Status: ${data.status}, Seller Hash: ${data.sellerHash}.\n\t\t\tItem Name: ${data.item?.name}, Item Float: ${data.item?.float}, Item Price: ${data.item?.price}, Item Ask Price: ${data.item?.askPrice}, Item Stickers: ${data.item?.stickers?.map(sticker => `Slot ${sticker.slot}: ${sticker.name}`).join(', ') || 'None'}`);
			case 'p2p:listing:remove':
				delete ACTIVE_LISTINGS[data.id];

				return Logger.info(`[WEBSOCKET] A p2p listing was removed. ID: ${data.id}`);
		}
	});

	instance.initialize();
}

main();