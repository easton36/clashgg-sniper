const { fetchPricingData } = require('./api');
const Logger = require('../utils/logger.util');
const { Item } = require('../db/index');

/**
 * Fetches and inserts pricing data
 * @param {String} apiKey - The API key for pricempire
 */
const fetchAndInsertPricingData = async (apiKey) => {
	Logger.info('[PRICEMPIRE] Fetching pricing data...');

	const pricingData = await fetchPricingData(apiKey);
	if(!pricingData) return;

	const formattedPrices = Object.entries(pricingData).map(([name, data]) => ({
		name,
		prices: {
			buff163: data?.buff163,
			buff163_quick: data?.buff163_quick,
			buff163_avg7: data?.buff163_avg7,
			buff163_avg30: data?.buff163_avg30
		}
	}));

	// insert or replace the pricing data
	const result = await Item.bulkWrite(formattedPrices.map(({ name, prices }) => ({
		updateOne: {
			filter: { name },
			update: { $set: { name, prices } },
			upsert: true
		}
	})));

	Logger.info(`[PRICEMPIRE] Successfully inserted ${result?.result?.nUpserted || 0} new items and updated ${result?.result?.nModified || 0} existing items`);

	return true;
};

/**
 * Fetches an item price from the database
 * @param {String} name - The name of the item
 * @returns {Object} The item pricing data
 */
const fetchItemPrice = async (name) => {
	const data = await Item.findOne({ name });

	return data;
};

module.exports = {
	fetchAndInsertPricingData,
	fetchItemPrice
};