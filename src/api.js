const axios = require('axios');

const Logger = require('./utils/logger.util');
const CONFIG = require('./config');

const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
	'Accept': '*/*',
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

		return accessToken;
	} catch(err){
		Logger.error(`[API] An error occurred while getting the access token: ${err?.response?.data?.message || err.message || err}`);
	}
};

/**
 * Fetches Clash.gg profile
 * @param {String} accessToken - The access token for the Clash.gg API
 * @returns {Promise<Object>} The profile
 * @throws {Error} The error which occurred
 */
const getProfile = async (accessToken) => {
	try{
		const response = await instance.get('/user/me', {
			headers: {
				...DEFAULT_HEADERS,
				Authorization: `Bearer ${accessToken}`
			}
		});

		const profile = response?.data;
		if(!profile){
			throw new Error('No profile was found');
		}

		return profile;
	} catch(err){
		Logger.error(`[API] An error occurred while getting the profile: ${err?.response?.data?.message || err.message || err}`);
	}
};

/**
 * Fetches Clash.gg p2p listings
 * @param {String} accessToken - The access token for the Clash.gg API
 * @returns {Promise<Object>} The p2p listings
 */

module.exports = {
	getAccessToken,
	getProfile
};