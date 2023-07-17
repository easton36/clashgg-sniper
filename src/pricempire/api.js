const axios = require('axios');

const CONFIG = require('../config');
const Logger = require('../utils/logger.util');

/**
 * Fetches all pricempire pricing data
 * @param {String} apiKey - The API key for the Pricempire API
 * @returns {Promise<Object>} The pricing data
 */
const fetchPricingData = async (apiKey) => {
	try{
		const response = await axios.get(`${CONFIG.PRICEMPIRE_API_URL}/v2/getAllItems`, {
			params: {
				api_key: apiKey,
				source: 'buff,buff163_quick,buff_avg7,buff_avg30'
			}
		});

		const pricingData = response?.data;

		return pricingData;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[PRICEMPIRE] An error occurred while fetching pricing data: ${errMessage}`);

		return false;
	}
};

module.exports = {
	fetchPricingData
};