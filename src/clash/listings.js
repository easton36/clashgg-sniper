const Logger = require('../utils/logger.util');
const { formatListing } = require('./helpers');
const { Item } = require('../db/index');

const CONFIG = require('../config');

const ACTIVE_LISTINGS = {};

/**
 * Fetches an item price from the database
 * @param {String} name - The name of the item
 * @returns {Object} The item pricing data
 */
const fetchItemPrice = async (name) => {
	const data = await Item.findOne({ name });

	return data;
};

/**
 * When a new p2p listing is created
 * @param {Object} data - The data of the p2p listing
 * @returns {Boolean} Whether or not the listing should be sniped
 */
const newListingCreated = (data) => {
	const { item } = data;
	const markupPercentage = item?.askPrice / item?.price;

	// check if meets criteria
	const containsStringToIgnore = CONFIG.STRINGS_TO_IGNORE.some(string => item?.name.toLowerCase().includes(string.toLowerCase()));
	if(item?.askPrice < CONFIG.MIN_PRICE || item?.askPrice > CONFIG.MAX_PRICE || CONFIG.ITEMS_TO_IGNORE.includes(item?.name) || markupPercentage > CONFIG.MAX_MARKUP_PERCENT || containsStringToIgnore){
		Logger.info(`[WEBSOCKET] Received new p2p listing, but it was ignored. ${formatListing(data, true)}`);

		return false;
	}

	ACTIVE_LISTINGS[data.id] = data;
	Logger.info(`[WEBSOCKET] Received new p2p listing to SNIPE. ${formatListing(data)}`);

	return true;
};

/**
 * When a p2p listing is removed
 * @param {Object} data - The data of the p2p listing
 * @returns {void}
 */
const listingRemoved = (data) => {
	const listing = ACTIVE_LISTINGS[data.id];
	if(!listing) return;

	delete ACTIVE_LISTINGS[data.id];

	return Logger.info(`[WEBSOCKET] A p2p listing we were watching was removed. ${formatListing(listing, true)}`);
};

/**
 * When a p2p listing is updated
 * @param {Object} data - The data of the p2p listing
 * @param {String} steamId - The Steam ID of the us
 * @returns {String} The status of the p2p listing
 */
const listingUpdated = (data, steamId) => {
	const listingStatus = data?.status;

	switch(listingStatus){
	case 'ASKED': {
		const sellerSteamId = data?.seller?.steamId;

		if(sellerSteamId === steamId){
			Logger.info(`[WEBSOCKET] We were ASKED to sell a p2p listing. ${formatListing(data, true)}`);
		} else{
			Logger.info(`[WEBSOCKET] We ASKED to purchase a p2p listing. ${formatListing(data, true)}`);
		}
		break;
	}
	case 'CANCELED-SYSTEM':
		Logger.warn(`[WEBSOCKET] A p2p listing we asked to purchase was CANCELED by the system. ${formatListing(data, true)}`);
		break;

	// seller has accepted our offer
	case 'ANSWERED':
		Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was ACCEPTED by the seller. ${formatListing(data, true)}`);
		break;

	// seller has sent the steam trade
	case 'SENT':
		Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was SENT by the seller. ${formatListing(data, true)}`);
		break;

	// we accepted the steam trade
	case 'RECEIVED':
		Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was RECEIVED by us. ${formatListing(data, true)}`);
		break;

	default:
		Logger.info(`[WEBSOCKET] Received unknown status ${listingStatus} for p2p listing. ${formatListing(data, true)}`);
	}

	return listingStatus;
};

module.exports = {
	newListingCreated,
	listingRemoved,
	listingUpdated
};