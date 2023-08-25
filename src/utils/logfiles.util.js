const fs = require('fs');
const path = require('path');

const Logger = require('./logger.util');

const purchasedItemsLogFile = path.join(__dirname, '..', '..', 'logs', 'purchased_items.json');
const soldItemsLogFile = path.join(__dirname, '..', '..', 'logs', 'sold_items.json');

/**
 * Creates a purchased item log file
 * @param {Object} data - The data to log
 * @param {String} data.id - The ID of the Clash.gg listing
 * @param {Object} data.item - The item data
 * @param {String} data.item.name - The name of the item
 * @param {Number} data.item.appid - The appid of the item
 * @param {Number} data.item.contextid - The contextid of the item
 * @param {Number} data.item.assetid - The assetid of the item
 * @param {Number} data.item.price - The price of the item
 * @param {Number} data.item.askPrice - The ask price of the item (The price we bought it for)
 * @param {Number} data.item.priceUsd - The price of the item in USD
 * @param {Number} data.item.askPriceUsd - The ask price of the item in USD
 * @param {Number} data.item.markupPercentage - The markup percentage of the item
 * @param {Number} data.item.buffPrice - OPTIONAL; The buff price of the item
 * @param {Number} data.item.buffPercentage - OPTIONAL; The buff percentage of the item
 * @param {String} data.item.dopplerPhase - OPTIONAL; The doppler phase of the item
 * @param {Object} data.seller - The seller data
 * @param {String} data.seller.steamId - The Steam ID of the seller
 * @param {String} data.seller.name - The name of the seller
 * @param {String} data.purchasedAt - The date the item was purchased
 * @param {String} data.receivedAt - The date the item was received in Steam
 */
const createPurchasedItemLogFile = (data) => {
	try{
		// append object to array in log file
		const logFile = JSON.parse(fs.readFileSync(purchasedItemsLogFile));
		logFile.push(data);

		// write to log file
		fs.writeFileSync(purchasedItemsLogFile, JSON.stringify(logFile, null, 4));

		Logger.info(`[LOG] Created purchased item log file for listing ${data?.id}`);
	} catch(err){
		Logger.error(`[LOG] An error occurred while creating purchased item log file for listing ${data?.id}: ${err?.message || err}`);
	}
};

/**
 * Creates a sold item log file
 * @param {Object} data - The data to log
 * @param {String} data.id - The ID of the Clash.gg listing
 * @param {Object} data.item - The item data
 * @param {String} data.item.name - The name of the item
 * @param {Number} data.item.appid - The appid of the item
 * @param {Number} data.item.contextid - The contextid of the item
 * @param {Number} data.item.assetid - The assetid of the item
 * @param {Number} data.item.price - The price of the item
 * @param {Number} data.item.priceUsd - The price of the item in USD
 * @param {Number} data.item.markupPercentage - The markup percentage of the item
 * @param {Object} data.buyer - The buyer data
 * @param {String} data.buyer.steamId - The Steam ID of the buyer
 * @param {String} data.buyer.name - The name of the buyer
 * @param {String} data.buyer.tradelink - The tradelink of the buyer
 * @param {String} data.soldAt - The date the item was sold
 * @param {String} data.receivedAt - The date the item was received in Steam
 */
const createSoldItemLogFile = (data) => {
	try{
		// append object to array in log file
		const logFile = JSON.parse(fs.readFileSync(soldItemsLogFile));
		logFile.push(data);

		// write to log file
		fs.writeFileSync(soldItemsLogFile, JSON.stringify(logFile, null, 4));

		Logger.info(`[LOG] Created sold item log file for listing ${data?.id}`);
	} catch(err){
		Logger.error(`[LOG] An error occurred while creating sold item log file for listing ${data?.id}: ${err?.message || err}`);
	}
};

/**
 * Finds a buy log file by item
 * @param {String} name - The name of the item
 * @param {Number} assetid - The assetid of the item
 * @returns {Object} The log object
 */
const findBuyLogFileByItem = (name, assetid) => {
	try{
		Logger.info(`[LOG] Finding buy log file by item ${name} (${assetid})`);
		// read log file
		const logFile = JSON.parse(fs.readFileSync(purchasedItemsLogFile));

		// find item in log file
		const item = logFile.find((item) => item?.item?.name === name && item?.item?.assetid === assetid);
		if(!item) throw new Error(`Could not find buy log file by item ${name} (${assetid})`);

		return item;
	} catch(err){
		Logger.error(`[LOG] An error occurred while finding buy log file by item: ${err?.message || err}`);

		return null;
	}
};

module.exports = {
	createPurchasedItemLogFile,
	createSoldItemLogFile,
	findBuyLogFileByItem
};