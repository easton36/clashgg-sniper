const Logger = require('./utils/logger.util');

const ACTIVE_LISTINGS = {};

/**
 * When a new p2p listing is created
 * @param {Object} data - The data of the p2p listing
 * @returns {void}
 */
const newListingCreated = (data) => {
	ACTIVE_LISTINGS[data.id] = data;

	return Logger.info(`[WEBSOCKET] Received new p2p listing. ID: ${data.id}, Status: ${data.status}, Seller Hash: ${data.sellerHash}.\n\t\t\tItem Name: ${data.item?.name}, Item Float: ${data.item?.float}, Item Price: ${data.item?.price}, Item Ask Price: ${data.item?.askPrice}, Item Stickers: ${data.item?.stickers?.map(sticker => `Slot ${sticker.slot}: ${sticker.name}`).join(', ') || 'None'}`);
};

/**
 * When a p2p listing is removed
 * @param {Object} data - The data of the p2p listing
 * @returns {void}
 */
const listingRemoved = (data) => {
	delete ACTIVE_LISTINGS[data.id];

	return Logger.info(`[WEBSOCKET] A p2p listing was removed. ID: ${data.id}`);
};

module.exports = {
	newListingCreated,
	listingRemoved
};