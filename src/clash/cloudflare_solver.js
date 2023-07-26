const puppeteer = require('puppeteer-extra');
const { executablePath } = require('puppeteer');
const stealth = require('puppeteer-extra-plugin-stealth');
const userPrefs = require('puppeteer-extra-plugin-user-preferences');

const Logger = require('../utils/logger.util');
// const CONFIG = require('../config.js');

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
						currentDockState: '"right"'
					}
				}
			}
		}));

		/**
		 * I Found that opening devtools is the easiest way to instantly pass the cloudflare check... lmao
		 */
		const browser = await puppeteer.launch({
			headless: 'new',
			executablePath: executablePath(),
			ignoreDefaultArgs: ['--enable-automation'],
			args: [
				'--disable-web-security',
				'--disable-features=IsolateOrigins,site-per-process',
				'--allow-running-insecure-content',
				'--disable-blink-features=AutomationControlled',
				'--no-sandbox',
				'--mute-audio',
				'--no-zygote',
				'--no-xshm',
				'--window-size=1920,1080',
				'--no-first-run',
				'--no-default-browser-check',
				'--disable-dev-shm-usage',
				'--disable-gpu',
				'--enable-webgl',
				'--ignore-certificate-errors',
				'--lang=en-US,en;q=0.9',
				'--password-store=basic',
				'--disable-gpu-sandbox',
				'--disable-software-rasterizer',
				'--disable-background-timer-throttling',
				'--disable-backgrounding-occluded-windows',
				'--disable-renderer-backgrounding',
				'--disable-infobars',
				'--disable-breakpad',
				'--disable-canvas-aa',
				'--disable-2d-canvas-clip-aa',
				'--disable-gl-drawing-for-tests',
				'--enable-low-end-device-mode',
				'--start-maximized'
			],
			defaultViewport: null,
			devtools: true
		});
		const page = await browser.newPage();

		// set user agent
		await page.setExtraHTTPHeaders({
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' // CONFIG.USER_AGENT
		});

		// set cookies
		await page.setCookie({
			name: 'refresh_token',
			value: refreshToken,
			domain: 'clash.gg',
			HttpOnly: true,
			Secure: true
		});

		await page.goto('https://clash.gg/');

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