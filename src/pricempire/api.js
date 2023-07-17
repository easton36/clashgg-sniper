const axios = require('axios');

const CONFIG = require('../config');
const Logger = require('../utils/logger.util');

/**
 * Fetches all pricempire pricing data
 * @param {String} apiKey - The API key for the Pricempire API
 */
const fetchPricingData = async (apiKey) => {
	try{
		const response = await axios.get(`${CONFIG.PRICEMPIRE_API_URL}/v2/getAllItems`, {
			params: {
				api_key: apiKey,
				source: 'buff, buff_avg7, buff_lastsale'
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