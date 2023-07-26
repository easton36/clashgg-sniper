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
	let browser;
	try{
		puppeteer.use(stealth());
		puppeteer.use(userPrefs({
			userPrefs: {
				devtools: {
					preferences: {
						currentDockState: '"bottom"'
					}
				}
			}
		}));

		/**
		 * I Found that opening devtools is the easiest way to instantly pass the cloudflare check... lmao
		 */
		browser = await puppeteer.launch({
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
				'--window-size=2560,1440',
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

		// use the first tab
		const page = (await browser.pages())[0];
		// create random new tab
		const page2 = await browser.newPage();

		// set cookies
		if(refreshToken){
			await page.setCookie({
				name: 'refresh_token',
				value: refreshToken,
				domain: 'clash.gg',
				HttpOnly: true,
				Secure: true
			});
		}

		await page2.goto('https://clash.gg/');

		// wait between 2 and 5 seconds
		await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

		// focus on the first tab
		await page.bringToFront();

		await page.goto('https://clash.gg/');

		// close the second tab
		await page2.close();

		// wait for #__next to load
		await page.waitForSelector('#__next', { timeout: 60000 });

		// get body html
		const clashLoadedElement = await page.$('#__next');

		// Extract clearance cookie
		const cookies = await page.cookies();
		const clearanceCookie = cookies.find(cookie => cookie.name === 'cf_clearance');

		// if no clearanceCookie was found BUT clashLoadedElement was found, we are IP whitelisted
		if(!clearanceCookie && clashLoadedElement){
			Logger.warn('[CHROME] We are IP whitelisted on Clash.gg!');
		} else if(!clearanceCookie){
			Logger.error('[CHROME] Failed to retrieve the Cloudflare clearance cookie.');
		} else{
			Logger.info(`[CHROME] Fetched Cookie: cf_clearance=${clearanceCookie.value}`);
		}

		// Close the browser
		await browser.close();

		return clearanceCookie?.value || false;
	} catch(error){
		Logger.error(`[CHROME] An error occurred while fetching the Cloudflare clearance cookie: ${error?.message || error}`);

		await browser.close();

		return false;
	}
};

module.exports = {
	getCfClearance
};