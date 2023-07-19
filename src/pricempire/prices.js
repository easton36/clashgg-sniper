const { fetchPricingData } = require('./api');
const Logger = require('../utils/logger.util');
const { Item } = require('../db/index');

/**
 * Fetches and inserts pricing data
 * @param {String} apiKey - The API key for pricempire
 */
const fetchAndInsertPricingData = async (apiKey) => {
	const now = new Date();
	Logger.info('[PRICEMPIRE] Fetching pricing data...');

	const pricingData = await fetchPricingData(apiKey);
	if(!pricingData) return;

	const formattedPrices = Object.entries(pricingData).map(([name, data]) => ({
		name,
		prices: {
			buff163: data?.buff163,
			buff163_quick: data?.buff163_quick,
			buff163_avg7: data?.buff163_avg7,
			buff163_avg30: data?.buff163_avg30,
			// doppler phase 1
			buff_p1: data?.buff_p1,
			buff_p1_quick: data?.buff_p1_quick,
			buff_p1_avg7: data?.buff_p1_avg7,
			buff_p1_avg30: data?.buff_p1_avg30,
			// doppler phase 2
			buff_p2: data?.buff_p2,
			buff_p2_quick: data?.buff_p2_quick,
			buff_p2_avg7: data?.buff_p2_avg7,
			buff_p2_avg30: data?.buff_p2_avg30,
			// doppler phase 3
			buff_p3: data?.buff_p3,
			buff_p3_quick: data?.buff_p3_quick,
			buff_p3_avg7: data?.buff_p3_avg7,
			buff_p3_avg30: data?.buff_p3_avg30,
			// doppler phase 4
			buff_p4: data?.buff_p4,
			buff_p4_quick: data?.buff_p4_quick,
			buff_p4_avg7: data?.buff_p4_avg7,
			buff_p4_avg30: data?.buff_p4_avg30,
			// doppler ruby
			buff_ruby: data?.buff_ruby,
			buff_ruby_quick: data?.buff_ruby_quick,
			buff_ruby_avg7: data?.buff_ruby_avg7,
			buff_ruby_avg30: data?.buff_ruby_avg30,
			// doppler sapphire
			buff_sapphire: data?.buff_sapphire,
			buff_sapphire_quick: data?.buff_sapphire_quick,
			buff_sapphire_avg7: data?.buff_sapphire_avg7,
			buff_sapphire_avg30: data?.buff_sapphire_avg30,
			// doppler black pearl
			buff_bp: data?.buff_bp,
			buff_bp_quick: data?.buff_bp_quick,
			buff_bp_avg7: data?.buff_bp_avg7,
			buff_bp_avg30: data?.buff_bp_avg30,
			// gamma doppler emerald
			buff_emerald: data?.buff_emerald,
			buff_emerald_quick: data?.buff_emerald_quick,
			buff_emerald_avg7: data?.buff_emerald_avg7,
			buff_emerald_avg30: data?.buff_emerald_avg30
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

	Logger.info(`[PRICEMPIRE] Successfully inserted ${result?.result?.nUpserted || 0} new items and updated ${result?.result?.nModified || 0} existing items.`);
	const timeTaken = new Date() - now;
	if(timeTaken > 60 * 1000){
		Logger.warn(`[PRICEMPIRE] Took ${timeTaken / 1000} seconds to fetch and insert pricing data.`);
	} else{
		Logger.info(`[PRICEMPIRE] Took ${timeTaken / 1000} seconds to fetch and insert pricing data.`);
	}

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