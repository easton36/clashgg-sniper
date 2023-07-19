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
 * @param {String} purchasedAt - The date the item was purchased
 * @param {String} receivedAt - The date the item was received in Steam
 */
const createPurchasedItemLogFile = (data) => {
	try{
		const log = {
			id: data?.id, // the ID of the Clash.gg listing
			item: {
				name: data?.item?.name, // the name of the item
				appid: data?.item?.appid, // the appid of the item
				contextid: data?.item?.contextid, // the contextid of the item
				assetid: data?.item?.assetid, // the assetid of the item
				price: data?.item?.price, // the price of the item
				askPrice: data?.item?.askPrice, // the ask price of the item (The price we bought it for)
				priceUsd: data?.item?.priceUsd, // the price of the item in USD
				askPriceUsd: data?.item?.askPriceUsd, // the ask price of the item in USD
				markupPercentage: data?.item?.markupPercentage, // the markup percentage of the item
				buffPrice: data?.item?.buffPrice, // OPTIONAL; the buff price of the item
				buffPercentage: data?.item?.buffPercentage, // OPTIONAL; the buff percentage of the item
				dopplerPhase: data?.item?.dopplerPhase // OPTIONAL; the doppler phase of the item
			},
			seller: {
				steamId: data?.seller?.steamId, // the Steam ID of the seller
				name: data?.seller?.name // the name of the seller
			},
			purchasedAt: data?.purchasedAt, // the date the item was purchased
			receivedAt: data?.receivedAt // the date the item was received in Steam
		};

		// append object to array in log file
		const logFile = JSON.parse(fs.readFileSync(purchasedItemsLogFile));
		logFile.push(log);

		// write to log file
		fs.writeFileSync(purchasedItemsLogFile, JSON.stringify(logFile, null, 4));

		Logger.info(`[LOG] Created purchased item log file for listing ${data?.id}`);
	} catch(err){
		Logger.error(`[LOG] An error occurred while creating purchased item log file for listing ${data?.id}: ${err?.message || err}`);
	}
};