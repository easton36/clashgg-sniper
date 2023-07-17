const axios = require('axios');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
	Accept: '*/*',
	'Accept-Encoding': 'gzip, deflate, br',
	'Accept-Language': 'en-US,en;q=0.9'
};

const instance = axios.create({
	baseURL: CONFIG.CLASH_API_URL,
	headers: DEFAULT_HEADERS
});

/**
 * Gets a Clash.gg access token
 * @param {String} refreshToken - The refresh token for the Clash.gg access token
 * @param {String} cfClearance - The cf_clearance cookie for the Clash.gg access token
 * @returns {Promise<String>} The Clash.gg access token
 * @throws {Error} The error which occurred
 */
const getAccessToken = async (refreshToken, cfClearance) => {
	try{
		const response = await instance.get('/auth/access-token', {
			headers: {
				...DEFAULT_HEADERS,
				Cookie: `cf_clearance=${cfClearance}; refresh_token=${refreshToken}`
			}
		});

		const accessToken = response?.data?.accessToken;
		if(!accessToken){
			throw new Error('No access token was found');
		}

		// set the cf_clearance cookie
		instance.defaults.headers.Cookie = `cf_clearance=${cfClearance}; refresh_token=${refreshToken}`;
		// set the access token as the authorization header
		instance.defaults.headers.Authorization = `Bearer ${accessToken}`;

		return accessToken;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while getting the access token: ${errMessage}`);

		return false;
	}
};

/**
 * Fetches Clash.gg profile
 * @returns {Promise<Object>} The profile
 * @throws {Error} The error which occurred
 */
const getProfile = async () => {
	try{
		const response = await instance.get('/user/me');

		const profile = response?.data;
		if(!profile){
			throw new Error('No profile was found');
		}

		return profile;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while getting the profile: ${errMessage}`);

		return false;
	}
};

/**
 * Fetches Clash.gg active listings
 * @returns {Promise<Object>} The listings
 */
const getActiveListings = async () => {
	try{
		const response = await instance.get('/steam-p2p/listings/my-active');

		const listings = response?.data;

		return listings;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while getting the active listings: ${errMessage}`);

		return false;
	}
};

/**
 * Buys a Clash.gg listing
 * @param {String} listingId - The ID of the listing to buy
 * @returns {Promise<Boolean>} Whether or not the listing was bought
 */
const buyListing = async (listingId) => {
	try{
		const response = await instance({
			method: 'PATCH',
			url: `/steam-p2p/listings/${listingId}/buy`
		});

		if(!response?.data?.success){
			Logger.error(`[API] An error occurred while buying the listing (${listingId}): ${response?.data?.message || 'No message was found'}`);

			return false;
		}

		Logger.info(`[API] Successfully bought the listing (${listingId})! New site balance: ${response?.data?.newBalance}`);

		return true;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while buying the listing (${listingId}): ${errMessage}${errMessage === 'resource_unavailable' ? ' (Someone else beat us to it)' : ''}`);

		// if we are Unauthorized, we need to get a new access token
		if(errMessage === 'Unauthorized'){
			throw new Error('Unauthorized');
		}

		return false;
	}
};

/**
 * Fetches Clash.gg steam inventory
 * @returns {Promise<Object>} The steam inventory
 */
const getSteamInventory = async () => {
	try{
		const response = await instance.get('/steam/inventory');

		const items = response?.data;

		return items;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while getting the steam inventory: ${errMessage}`);

		return false;
	}
};

/**
 * Deletes a Clash.gg listing
 * @param {String} listingId - The ID of the listing to delete
 * @returns {Promise<Boolean>} Whether or not the listing was deleted
 */
const deleteListing = async (listingId) => {
	try{
		const response = await instance({
			method: 'DELETE',
			url: `/steam-p2p/listings/${listingId}`
		});

		if(!response?.data?.success){
			Logger.error(`[API] An error occurred while deleting the listing (${listingId}): ${response?.data?.message || 'No message was found'}`);
		}

		Logger.info(`[API] Successfully deleted the listing (${listingId})!`);

		return true;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while deleting the listing (${listingId}): ${errMessage}`);

		return false;
	}
};

/**
 * Creates a Clash.gg listing
 * @param {String} externalId - The externalId of the item to list
 * @param {Number} price - The price of the item to list
 * @returns {Promise<Object>} The listing
 */
const createListing = async (externalId, price) => {
	try{
		const response = await instance({
			method: 'POST',
			url: '/steam-p2p/listings',
			data: {
				items: [{
					externalId,
					askPrice: price
				}]
			}
		});

		const success = response?.data?.status === 'OPEN';
		if(!success){
			Logger.error(`[API] An error occurred while creating the listing (${externalId}): ${response?.data?.message || 'No message was found'}`);
		}

		return response?.data;
	} catch(err){
		const errMessage = err?.response?.data?.message || err.message || err;
		Logger.error(`[API] An error occurred while creating the listing (${externalId}): ${errMessage}`);

		return false;
	}
};

module.exports = {
	getAccessToken,
	getProfile,
	getActiveListings,
	buyListing,
	getSteamInventory,
	deleteListing,
	createListing
};