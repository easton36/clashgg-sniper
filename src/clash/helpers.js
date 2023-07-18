const CONFIG = require('../config');

/**
 * Formats some listing JSON into human-readable text
 * @param {Object} data - The listing to format
 * @param {String} status - The status of the listing
 * @param {Object} extraData - Extra data to add to the listing
 * @returns {String} The formatted listing
 */
const formatListing = (data, status, extraData) => {
	let itemString = `Listing ID: ${data.id}, Item Name: ${data.item?.name}`;
	itemString += `\n\t\tItem Price (COINS): ${data.item?.price}, Item Ask Price (COINS): ${data.item?.askPrice}, Item Markup: ${data?.item?.askPrice / data?.item?.price}`;
	itemString += `\n\t\tItem Price (USD): ${data.item?.price * CONFIG.CLASH_COIN_CONVERSION}, Item Ask Price (USD): ${data.item?.askPrice * CONFIG.CLASH_COIN_CONVERSION}`;

	switch(status){
	case 'buff':
		itemString += `Item Ask Price (USD): ${extraData.askPriceUSD}, Item Buff Price: ${extraData?.buffPrice}, Buff Percentage: ${extraData.buffPercentage}`;
		break;

	case 'ignored':
		itemString += `\n\t\tItem Float: ${data.item?.float || 'N/A'}, Item Stickers: ${data.item?.stickers?.map(sticker => `Slot ${sticker.slot}: ${sticker.name}`).join(', ') || 'None'}`;
		break;
	}

	return itemString;
};

module.exports = {
	formatListing
};