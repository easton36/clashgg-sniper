const axios = require('axios');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const WEBHOOK_USERNAME = 'Clash.gg Sniper';
const WEBHOOK_AVATAR_URL = 'https://transfer.sh/D9ooJ9pnew/Untitled.png';

/**
 * Discord webhook when the script starts
 * @param {String} webhookURL - The URL of the Discord webhook
 */
const scriptStarted = async (webhookURL) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Script Started',
					color: 16755968,
					fields: [
						{
							name: 'Version',
							value: CONFIG.VERSION
						}
					],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the script started webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the script started webhook: ${errMessage}`);
	}
};

/**
 * Discord webhook that an item has been purchased
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Object} data - The data of the p2p listing
 */
const itemPurchased = async (webhookURL, data) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Item Purchased',
					color: 5814783,
					fields: [
						{
							name: 'Listing ID',
							value: data?.id
						},
						{
							name: 'Name',
							value: data?.item?.name
						},
						{
							name: 'Price (USD)',
							value: `$${((data?.item?.askPrice * CONFIG.CLASH_COIN_CONVERSION) / 100).toFixed(2)}`
						},
						{
							name: 'Price (Coins)',
							value: `$${(data?.item?.askPrice / 100).toFixed(2)}`
						},
						{
							name: 'Item Markup',
							value: `${data?.item?.askPrice / data?.item?.price}`
						}
					],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the item purchased webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the item purchased webhook: ${errMessage}`);
	}
};

/**
 * Discord webhook that a trade was accepted
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Object} data - The data of the trade
 */
const tradeOfferAccepted = async (webhookURL, data) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Trade Offer Accepted',
					color: 1376000,
					fields: [
						{
							name: 'Offer ID',
							value: data?.id
						},
						{
							name: 'Items Received',
							value: data?.itemsToReceive.map(item => item.market_hash_name).join(', ')
						},
						{
							name: 'Offer Partner',
							value: data?.partner.getSteamID64()
						}
					],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the trade offer accepted webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the trade offer accepted webhook: ${errMessage}`);
	}
};

module.exports = {
	scriptStarted,
	itemPurchased,
	tradeOfferAccepted
};