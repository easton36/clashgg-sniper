const Logger = require('../utils/logger.util');
const { formatListing } = require('./helpers');

const CONFIG = require('../config');

const ACTIVE_LISTINGS = {};

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
 * @returns {void}
 */
const listingUpdated = (data) => {
	const listingStatus = data?.status;

	switch(listingStatus){
	case 'ASKED':
		return Logger.info(`[WEBSOCKET] We ASKED to purchase a p2p listing. ${formatListing(data, true)}`);

	case 'CANCELED-SYSTEM':
		return Logger.warn(`[WEBSOCKET] A p2p listing we asked to purchase was CANCELED by the system. ${formatListing(data, true)}`);

	// seller has accepted our offer
	case 'ANSWERED':
		return Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was ACCEPTED by the seller. ${formatListing(data, true)}`);

	// seller has sent the steam trade
	case 'SENT':
		return Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was SENT by the seller. ${formatListing(data, true)}`);

	// we accepted the steam trade
	case 'RECEIVED':
		return Logger.info(`[WEBSOCKET] A p2p listing we asked to purchase was RECEIVED by us. ${formatListing(data, true)}`);

	default:
		return Logger.info(`[WEBSOCKET] Received unknown status ${listingStatus} for p2p listing. ${formatListing(data, true)}`);
	}
};

module.exports = {
	newListingCreated,
	listingRemoved,
	listingUpdated
};