const axios = require('axios');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'User-Agent': CONFIG.USER_AGENT,
	Accept: '*/*',
	'Accept-Encoding': 'gzip, deflate, br',
	'Accept-Language': 'en-US,en;q=0.9'
};

const instance = axios.create({
	baseURL: CONFIG.CLASH_API_URL,
	headers: DEFAULT_HEADERS
});

/**
 * Handles API responses
 * @param {Object} response - The API response
 * @param {String} successCondition - The condition that needs to be met for the operation to be considered successful
 * @param {String} errorMessage - The error message for the Logger
 * @param {Function} callback - The callback function to call if the operation was successful
 * @returns {Object|boolean} Returns the response data if successful, else false
 */
const handleResponse = (response, successCondition, errorMessage, callback) => {
	if(!successCondition){
		Logger.error(`[API] ${errorMessage}: ${response?.data?.message}`);
		if(!response?.data?.message){
			console.log(response?.data);
		}

		return false;
	}

	if(callback){
		callback();
	}

	return response?.data;
};

/**
 * Handles request errors
 * @param {Error} err - The error object
 * @param {String} errorMessage - The error message for the Logger
 * @returns {boolean} Always returns false
 */
const handleError = (err, errorMessage) => {
	const errMessage = err?.response?.data?.message || err.message || err;
	Logger.error(`[API] ${errorMessage}: ${errMessage}`);

	// if we are Unauthorized, we need to get a new access token
	if(errMessage === 'Unauthorized'){
		throw new Error('Unauthorized');
	}

	return false;
};

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
		return handleError(err, 'An error occurred while getting the access token');
	}
};

/**
 * Fetches Clash.gg profile
 * @returns {Promise<Object>} The profile
 * @throws {Error} The error which occurred
 */
const getProfile = async () => {
	const errorMessage = 'An error occurred while getting the profile';
	try{
		const response = await instance.get('/user/me');

		return handleResponse(response, response?.data?.id, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Fetches Clash.gg active listings
 * @returns {Promise<Object>} The listings
 */
const getActiveListings = async () => {
	const errorMessage = 'An error occurred while getting the active listings';
	try{
		const response = await instance.get('/steam-p2p/listings/my-active');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Buys a Clash.gg listing
 * @param {String} listingId - The ID of the listing to buy
 * @returns {Promise<Boolean>} Whether or not the listing was bought
 */
const buyListing = async (listingId) => {
	const errorMessage = `An error occurred while buying the listing (${listingId})`;
	try{
		const response = await instance({
			method: 'PATCH',
			url: `/steam-p2p/listings/${listingId}/buy`
		});

		return handleResponse(response, response?.data?.success, errorMessage, () => {
			Logger.info(`[API] Successfully bought the listing (${listingId})! New site balance: ${response?.data?.newBalance}`);
		});
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Fetches Clash.gg steam inventory
 * @returns {Promise<Object>} The steam inventory
 */
const getSteamInventory = async () => {
	const errorMessage = 'An error occurred while getting the steam inventory';
	try{
		const response = await instance.get('/steam/inventory');

		return handleResponse(response, response?.data, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Deletes a Clash.gg listing
 * @param {String} listingId - The ID of the listing to delete
 * @returns {Promise<Boolean>} Whether or not the listing was deleted
 */
const deleteListing = async (listingId) => {
	const errorMessage = `An error occurred while deleting the listing (${listingId})`;
	try{
		const response = await instance({
			method: 'DELETE',
			url: `/steam-p2p/listings/${listingId}`
		});

		return handleResponse(response, response?.data?.success, errorMessage, () => {
			Logger.info(`[API] Successfully deleted the listing (${listingId})`);
		});
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Creates a Clash.gg listing
 * @param {String} externalId - The externalId of the item to list
 * @param {Number} price - The price of the item to list
 * @returns {Promise<Object>} The listing
 */
const createListing = async (externalId, price) => {
	const errorMessage = `An error occurred while creating the listing (${externalId})`;
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

		return handleResponse(response, response?.data[0]?.status === 'OPEN', errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Answers a Clash.gg listing asking to sell an item
 * @param {String} listingId - The ID of the listing to answer
 * @returns {Promise<Boolean>} Whether or not the listing was answered
 */
const answerListing = async (listingId) => {
	const errorMessage = `An error occurred while answering the listing (${listingId})`;
	try{
		const response = await instance({
			method: 'PATCH',
			url: `/steam-p2p/listings/${listingId}/answer`
		});

		return handleResponse(response, response?.data?.listing?.status === 'ANSWERED', errorMessage, () => {
			Logger.info(`[API] Successfully answered the listing (${listingId})`);
		});
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Tells clash.gg that we are still online
 */
const steamP2pOnline = async () => {
	const errorMessage = 'An error occurred while telling Clash.gg we are still online';
	try{
		const response = await instance({
			method: 'POST',
			url: '/steam-p2p/online'
		});

		return handleResponse(response, response?.data?.success, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Opens a free case on Clash.gg
 * @param {String} clientSeed - The client seed to use
 * @param {String} caseSlug - The slug of the case to open
 * @returns {Promise<Object>} The case
 */
const openCase = async (clientSeed, caseSlug) => {
	const errorMessage = `An error occurred while opening the case (${caseSlug})`;
	try{
		const response = await instance({
			method: 'POST',
			url: '/cases/open',
			data: {
				amount: 1,
				slug: caseSlug,
				clientSeed
			}
		});

		return handleResponse(response, response?.data?.total === 1, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets all cases on Clash.gg
 */
const getCases = async () => {
	const errorMessage = 'An error occurred while getting all cases';
	try{
		const response = await instance.get('/cases');

		return handleResponse(response, response?.data?.length > 0, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

/**
 * Gets all free case cooldowns on Clash.gg
 */
const getFreeCaseCooldowns = async () => {
	const errorMessage = 'An error occurred while getting all free case cooldowns';
	try{
		const response = await instance.get('/cases/level-cooldown/all');

		return handleResponse(response, response?.data?.length > 0, errorMessage);
	} catch(err){
		return handleError(err, errorMessage);
	}
};

module.exports = {
	getAccessToken,
	getProfile,
	getActiveListings,
	buyListing,
	getSteamInventory,
	deleteListing,
	createListing,
	answerListing,
	steamP2pOnline,

	openCase,
	getCases,
	getFreeCaseCooldowns
};