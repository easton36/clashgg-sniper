const axios = require('axios');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const WEBHOOK_USERNAME = 'Clash.gg Sniper';
const WEBHOOK_AVATAR_URL = 'https://transfer.sh/D9ooJ9pnew/Untitled.png';

const WEBHOOK_COLOR = {
	error: 16711680,
	success: 1376000,
	warn: 16755968,
	info: 5814783
};

/**
 * Discord webhook notification manager
 * @param {String} webhookURL - The URL of the Discord webhook
 */
const DiscordWebhook = (webhookURL) => {
	const AXIOS_TEMPLATE = {
		method: 'POST',
		url: webhookURL,
		data: {
			content: null,
			embeds: [],
			username: WEBHOOK_USERNAME,
			avatar_url: WEBHOOK_AVATAR_URL,
			attachments: []
		}
	};

	/**
	 * Builds the axios data template
	 * @param {String} webhookType - The type of webhook to build
	 * @param {String} title - The title of the webhook
	 * @param {Array} fields - The fields of the webhook
	 * @returns {Object} - The axios data template
	 */
	const buildAxiosTemplate = (webhookType, title, fields) => {
		const embed = {
			title,
			color: WEBHOOK_COLOR.SUCCESS,
			fields,
			timestamp: new Date().toJSON()
		};

		// build the webhook data
		const data = {
			...AXIOS_TEMPLATE,
		};
		data.data.embeds.push(embed);

		return data;
	};

	/**
	 * Handles the response of the webhook
	 * @param {Object} response - The response of the webhook
	 * @param {String} webhookType - The type of webhook to build
	 * @param {String} title - The title of the webhook
	 */
	const handleResponse = (response, webhookType, title) => {
		
	};

	/**
	 * Handles the error of the webhook
	 * @param {Object} err - The error of the webhook
	 * @param {String} webhookType - The type of webhook to build
	 * @param {String} title - The title of the webhook
	 */
	const handleError = (err, webhookType, title) => {
		const errMessage = err?.response?.data?.message || err.message || err;
	};

	/**
	 * Sends a success webhook notification
	 * @param {String} title - The title of the webhook
	 * @param {Array} fields - The fields of the webhook
	 */
	const send = async (title, fields) => {
		try{
			const data = buildAxiosTemplate('success', title, fields);
			// send the webhook
			const response = await axios(data);

			return handleResponse(response, 'success', title);
		} catch(err){
			return handleError(err, 'success', title);
		}
	};

	return {
		send
	};
};

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
 * @param {String} extraData - Extra data to send
 */
const itemPurchased = async (webhookURL, data, extraData) => {
	try{
		const fields = [
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
				value: `$${((data?.item?.askPrice / CONFIG.CLASH_COIN_CONVERSION) / 100).toFixed(2)}`
			},
			{
				name: 'Price (Coins)',
				value: `$${(data?.item?.askPrice / 100).toFixed(2)}`
			},
			{
				name: 'Item Markup',
				value: `${((data?.item?.askPrice / data?.item?.price) - 1) * 100}%`
			}
		];

		if(extraData?.buffPrice){
			fields.push({
				name: 'Buff Price (USD)',
				value: `$${(extraData?.buffPrice / 100).toFixed(2)}`
			});

			fields.push({
				name: 'Buff Percentage',
				value: `${extraData?.buffPercentage * 100}%`
			});
		}

		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Item Purchased',
					color: 5814783,
					fields,
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
 * Discord webhook that a listing we purchased was canceled
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Object} data - The data of the p2p listing
 * @param {Boolean} sell - Whether or not the listing was a sell listing
 */
const listingCanceled = async (webhookURL, data, sell) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: sell ? 'Sell Canceled' : 'Purchase Canceled',
					description: `A listing we ${sell ? 'were selling' : 'purchased'} was canceled by the system.`,
					color: 16711680,
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
							name: 'Price (Coins)',
							value: `$${(data?.item?.askPrice / 100).toFixed(2)}`
						}
					],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the listing canceled webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the listing canceled webhook: ${errMessage}`);
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

/**
 * If we have to pause sniping due to low balance
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Number} balance - The balance of the account
 */
const pauseSniping = async (webhookURL, balance) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Paused Sniping',
					description: 'We have paused sniping due to low balance.',
					color: 16711680,
					fields: [{
						name: 'Balance (COINS)',
						value: `$${(balance / 100).toFixed(2)}`
					}],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the pause sniping webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the pause sniping webhook: ${errMessage}`);
	}
};

/**
 * If we re-enabled sniping
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Number} balance - The balance of the account
 */
const reEnableSniping = async (webhookURL, balance) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Re-Enabled Sniping',
					description: 'We have re-enabled sniping!',
					color: 1376000,
					fields: [{
						name: 'Balance (COINS)',
						value: `$${(balance / 100).toFixed(2)}`
					}],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the enable sniping webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the enable sniping webhook: ${errMessage}`);
	}
};

/**
 * If we sold an item
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Object} data - The data of the sold item
 * @param {String} data.id - The ID of the Clash.gg listing
 * @param {Object} data.item - The item data
 * @param {String} data.item.name - The name of the item
 * @param {Number} data.item.price - The price of the item
 * @param {Number} accountBalance - The balance of the account
 * @param {Object} buyLog - The buy log of the item if any
 */
const soldItem = async (webhookURL, data, accountBalance, buyLog) => {
	try{
		const fields = [
			{
				name: 'Listing ID',
				value: data?.id
			},
			{
				name: 'Item Name',
				value: data?.item?.name
			},
			{
				name: 'Price (USD)',
				value: `$${((data?.item?.askPrice / CONFIG.CLASH_COIN_CONVERSION) / 100).toFixed(2)}`
			},
			{
				name: 'Price (Coins)',
				value: `$${(data?.item?.askPrice / 100).toFixed(2)}`
			}
		];

		if(buyLog){
			const purchasePrice = buyLog?.item?.askPrice;
			const profit = data?.item?.askPrice - purchasePrice;
			const profitPercentage = (profit / purchasePrice) * 100;

			fields.push(
				{
					name: 'Purchase Price (USD)',
					value: `$${((purchasePrice / CONFIG.CLASH_COIN_CONVERSION) / 100).toFixed(2)}`
				},
				{
					name: 'Profit (USD)',
					value: `$${((profit / CONFIG.CLASH_COIN_CONVERSION) / 100).toFixed(2)}`
				},
				{
					name: 'Profit Percentage',
					value: `${profitPercentage}%`
				}
			);
		}

		fields.push({
			name: 'New Balance (Coins)',
			value: `$${(accountBalance / 100).toFixed(2)}`
		});

		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Sold Item',
					color: 1376000,
					fields,
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the sold item webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the sold item webhook: ${errMessage}`);
	}
};

/**
 * Letting us know how much we are worth
 * @param {String} webhookURL - The URL of the Discord webhook
 * @param {Number} accountBalance - The balance of the account
 * @param {Number} accountBalanceUsd - The balance of the account in USD
 * @param {Number} inventoryValue - The value of the inventory
 * @returns {Promise<void>}
 */
const accountValue = async (webhookURL, accountBalance, accountBalanceUsd, inventoryValue) => {
	try{
		const response = await axios({
			method: 'POST',
			url: webhookURL,
			data: {
				content: null,
				embeds: [{
					title: 'Account Value',
					color: 5814783,
					fields: [
						{
							name: 'Account Balance (Coins)',
							value: `$${(accountBalance / 100).toFixed(2)}`
						},
						{
							name: 'Account Balance (USD)',
							value: `$${(accountBalanceUsd / 100).toFixed(2)}`
						},
						{
							name: 'Inventory Value (USD)',
							value: `$${(inventoryValue / 100).toFixed(2)}`
						},
						{
							name: 'Currently Worth (USD)',
							value: `$${((accountBalanceUsd + inventoryValue) / 100).toFixed(2)}`
						}
					],
					timestamp: new Date().toJSON()
				}],
				username: WEBHOOK_USERNAME,
				avatar_url: WEBHOOK_AVATAR_URL,
				attachments: []
			}
		});

		return Logger.info(`[DISCORD] Successfully sent the account value webhook. Status: ${response.status}`);
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[DISCORD] An error occurred while sending the account value webhook: ${errMessage}`);
	}
};

module.exports = {
	scriptStarted,
	itemPurchased,
	listingCanceled,
	tradeOfferAccepted,
	pauseSniping,
	reEnableSniping,
	soldItem,
	accountValue
};