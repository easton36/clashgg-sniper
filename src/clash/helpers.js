const CONFIG = require('../config');

const { fetchItemPrice } = require('../pricempire/prices');
const { checkDopplerPhase } = require('../pricempire/doppler');

/**
 * Formats some listing JSON into human-readable text
 * @param {Object} data - The listing to format
 * @param {String} status - The status of the listing
 * @param {Object} extraData - Extra data to add to the listing
 * @returns {String} The formatted listing
 */
const formatListing = (data, status, extraData) => {
	let itemString = `Listing ID: ${data.id}, Item Name: ${data.item?.name}`;
	itemString += `\n\t\tItem Price (COINS): ${data.item?.price}, Item Ask Price (COINS): ${data.item?.askPrice}, Item Markup: ${data?.item?.askPrice / data?.item?.price}`;
	itemString += `\n\t\tItem Price (USD): ${data.item?.price / CONFIG.CLASH_COIN_CONVERSION}, Item Ask Price (USD): ${data.item?.askPrice / CONFIG.CLASH_COIN_CONVERSION}`;

	switch(status){
	case 'buff':
		itemString += `\n\t\tItem Buff Price: ${extraData?.buffPrice}, Buff Percentage: ${extraData.buffPercentage}`;
		break;

	case 'extra':
		itemString += `\n\t\tItem Float: ${data.item?.float || 'N/A'}, Item Stickers: ${data.item?.stickers?.map(sticker => `Slot ${sticker.slot}: ${sticker.name}`).join(', ') || 'None'}`;
		break;
	}

	return itemString;
};

/**
 * Formats some listing JSON into log file JSON
 * @param {Object} data - The listing to format
 * @param {String} type - The type of listing (buy or sell)
 */
const formatListingForLogFile = async (data, type, offerId) => {
	const [appid, contextid, assetid] = data?.item?.externalId?.split('|');

	const log = {
		id: data?.id, // the ID of the Clash.gg listing
		item: {
			name: data?.item?.name, // the name of the item
			appid: Number(appid), // the appid of the item
			contextid: Number(contextid), // the contextid of the item
			assetid: Number(assetid), // the assetid of the item
			float: data?.item?.float, // the float of the item
			stickers: data?.item?.stickers, // the stickers of the item
			price: data?.item?.price, // the price of the item
			askPrice: data?.item?.askPrice, // the ask price of the item
			priceUsd: data?.item?.price / CONFIG.CLASH_COIN_CONVERSION, // the price of the item in USD
			askPriceUsd: data?.item?.askPrice / CONFIG.CLASH_COIN_CONVERSION, // the ask price of the item in USD
			markupPercentage: data?.item?.askPrice / data?.item?.price // the markup percentage of the item
		}
	};

	if(type === 'buy'){
		log.seller = {
			steamId: data?.seller?.steamId, // the Steam ID of the seller
			name: data?.seller?.name, // the name of the seller
			role: data?.seller?.role // the role of the seller
		};
	} else{
		log.buyer = {
			steamId: data?.buyer?.steamId, // the Steam ID of the buyer
			name: data?.buyer?.name, // the name of the buyer
			tradelink: data?.buyerTradelink // the tradelink of the buyer
		};
	}

	if(offerId){
		log.offerId = offerId;
	}

	const dopplerPhase = checkDopplerPhase(data?.item?.imageUrl);
	if(dopplerPhase){
		log.item.dopplerPhase = dopplerPhase;
	}

	if(CONFIG.CHECK_BUFF_PRICE){
		const priceData = await fetchItemPrice(data?.item?.name);
		if(!priceData) return false;
		// calculate buff percentage, convert askPrice to USD
		const askPriceUSD = log.item.askPriceUsd;
		// if we have a doppler phase use that specific buff price
		const buffPrice = priceData?.prices[dopplerPhase ? `buff163_${dopplerPhase}` : 'buff163'];
		const buffPercentage = askPriceUSD / buffPrice;

		log.item.buffPrice = buffPrice;
		log.item.buffPercentage = buffPercentage;
	}

	return log;
};

module.exports = {
	formatListing,
	formatListingForLogFile
};