const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer');
const stealth = require('puppeteer-extra-plugin-stealth');
const userPrefs = require('puppeteer-extra-plugin-user-preferences');

const Logger = require('../utils/logger.util');

/**
 * Gets the Cloudflare clearance cookie
 * @param {String} refreshToken - The refresh token to use
 * @returns {Promise<void>}
 */
const getCfClearance = async (refreshToken) => {
	Logger.info('[CHROME] Fetching Cloudflare clearance cookie...');

	try{
		puppeteer.use(stealth());
		puppeteer.use(userPrefs({
			userPrefs: {
				devtools: {
					preferences: {
						currentDockState: '"undocked"'
					}
				}
			}
		}));

		const browser = await puppeteer.launch({
			headless: 'new',
			executablePath: executablePath(),
			args: [`--window-size=${1920},${1080}`],
			defaultViewport: {
				width: 1920,
				height: 1080
			},
			devtools: true
		});
		const page = await browser.newPage();
		// set cookies
		await page.setCookie({
			name: 'refresh_token',
			value: refreshToken,
			domain: 'clash.gg',
			HttpOnly: true,
			Secure: true
		});

		await page.goto('https://clash.gg');

		// wait for the page to load. ID __next
		await page.waitForSelector('#__next');

		// Extract clearance cookie
		const cookies = await page.cookies();
		const clearanceCookie = cookies.find(cookie => cookie.name === 'cf_clearance');
		if(!clearanceCookie){
			Logger.error('[CHROME] Failed to retrieve the Cloudflare clearance cookie.');

			return;
		}

		// Close the browser
		await browser.close();

		Logger.info(`[CHROME] Fetched Cookie: cf_clearance=${clearanceCookie.value}`);

		return clearanceCookie.value;
	} catch(error){
		Logger.error(`[CHROME] An error occurred while fetching the Cloudflare clearance cookie: ${error?.message || error}`);

		return false;
	}
};

module.exports = {
	getCfClearance
};