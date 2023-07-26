const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const purchasedItemsLogFile = path.join(__dirname, '..', '..', 'logs', 'purchased_items.json');
const soldItemsLogFile = path.join(__dirname, '..', '..', 'logs', 'sold_items.json');

const Logger = require('../utils/logger.util');

/**
 * yes I know having 2 of basically the same function is bad but I'm too lazy to make it one function
 */

/**
 * Converts sold items to CSV
 */
const convertSoldItemsToCsv = async () => {
	Logger.info('[CSV] Converting sold items to CSV...');

	const soldItems = JSON.parse(fs.readFileSync(soldItemsLogFile, 'utf8'));
	const flattenedSoldItems = soldItems.map(obj => {
		obj.item?.stickers?.forEach(sticker => {
			const slot = sticker.slot;
			obj.item[`sticker${slot}_name`] = sticker.name;
			obj.item[`sticker${slot}_codename`] = sticker.codename;
			obj.item[`sticker${slot}_material`] = sticker.material;
			obj.item[`sticker${slot}_stickerId`] = sticker.stickerId;
		});

		// if any sticker slots don't exist, set them to N/A
		for(let i = 1; i <= 4; i++){
			if(!obj.item[`sticker${i}_name`]){
				obj.item[`sticker${i}_name`] = 'N/A';
			}
			if(!obj.item[`sticker${i}_codename`]){
				obj.item[`sticker${i}_codename`] = 'N/A';
			}
			if(!obj.item[`sticker${i}_material`]){
				obj.item[`sticker${i}_material`] = 'N/A';
			}
			if(!obj.item[`sticker${i}_stickerId`]){
				obj.item[`sticker${i}_stickerId`] = 'N/A';
			}
		}

		delete obj.item.stickers;

		obj.item.price = obj.item.price / 100;
		obj.item.askPrice = obj.item.askPrice / 100;
		obj.item.priceUsd = obj.item.priceUsd / 100;
		obj.item.askPriceUsd = obj.item.askPriceUsd / 100;
		// convert 1.15 to 15% markup
		obj.item.markupPercentage = (obj.item.markupPercentage - 1) * 100;
		obj.item.buffPrice = obj.item.buffPrice / 100;
		// 1.0267435989902634 = 102.67% buff
		obj.item.buffPercentage = obj.item.buffPercentage * 100;

		obj.soldAt = new Date(obj.soldAt).toLocaleString();
		obj.receivedAt = new Date(obj.receivedAt).toLocaleString();

		// if any keys are undefined, set them to N/A
		Object.keys(obj).forEach(key => {
			if(!obj[key]){
				obj[key] = 'N/A';
			}
		});

		return obj;
	});

	const fields = [
		{
			label: 'Listing ID',
			value: 'id'
		},
		{
			label: 'Item Name',
			value: 'item.name'
		},
		{
			label: 'Item App ID',
			value: 'item.appid'
		},
		{
			label: 'Item Context ID',
			value: 'item.contextid'
		},
		{
			label: 'Item Asset ID',
			value: 'item.assetid'
		},
		{
			label: 'Item Float',
			value: 'item.float'
		},
		{
			label: 'Item Price',
			value: 'item.price'
		},
		{
			label: 'Item Ask Price',
			value: 'item.askPrice'
		},
		{
			label: 'Item Price (USD)',
			value: 'item.priceUsd'
		},
		{
			label: 'Item Ask Price (USD)',
			value: 'item.askPriceUsd'
		},
		{
			label: 'Item Markup Percentage',
			value: 'item.markupPercentage'
		},
		{
			label: 'Item Buff Price',
			value: 'item.buffPrice'
		},
		{
			label: 'Item Buff Percentage',
			value: 'item.buffPercentage'
		},
		{
			label: 'Buyer Steam ID',
			value: 'buyer.steamId'
		},
		{
			label: 'Buyer Name',
			value: 'buyer.name'
		},
		{
			label: 'Buyer Tradelink',
			value: 'buyer.tradelink'
		},
		{
			label: 'Offer ID',
			value: 'offerId'
		},
		{
			label: 'Sold At Date',
			value: 'soldAt'
		},
		{
			label: 'Received At Date',
			value: 'receivedAt'
		},
		{
			label: 'Sticker 1 Name',
			value: 'item.sticker1_name'
		},
		{
			label: 'Sticker 1 Codename',
			value: 'item.sticker1_codename'
		},
		{
			label: 'Sticker 1 Material',
			value: 'item.sticker1_material'
		},
		{
			label: 'Sticker 1 Sticker ID',
			value: 'item.sticker1_stickerId'
		},
		{
			label: 'Sticker 2 Name',
			value: 'item.sticker2_name'
		},
		{
			label: 'Sticker 2 Codename',
			value: 'item.sticker2_codename'
		},
		{
			label: 'Sticker 2 Material',
			value: 'item.sticker2_material'
		},
		{
			label: 'Sticker 2 Sticker ID',
			value: 'item.sticker2_stickerId'
		},
		{
			label: 'Sticker 3 Name',
			value: 'item.sticker3_name'
		},
		{
			label: 'Sticker 3 Codename',
			value: 'item.sticker3_codename'
		},
		{
			label: 'Sticker 3 Material',
			value: 'item.sticker3_material'
		},
		{
			label: 'Sticker 3 Sticker ID',
			value: 'item.sticker3_stickerId'
		},
		{
			label: 'Sticker 4 Name',
			value: 'item.sticker4_name'
		},
		{
			label: 'Sticker 4 Codename',
			value: 'item.sticker4_codename'
		},
		{
			label: 'Sticker 4 Material',
			value: 'item.sticker4_material'
		},
		{
			label: 'Sticker 4 Sticker ID',
			value: 'item.sticker4_stickerId'
		}
	];

	const json2csvParser = new Parser({ fields });
	const csv = json2csvParser.parse(flattenedSoldItems);

	const DATE = new Date().toJSON().split('T')[0];
	const csvPath = path.join(__dirname, '..', '..', 'output', `sold_items_${DATE}.csv`);

	fs.writeFileSync(csvPath, csv);

	Logger.info(`[CSV] Successfully converted sold items to CSV! Path: ${csvPath}`);
};

/**
 * Converts purchased items to CSV
 */
const convertPurchasedItemsToCsv = async () => {
	Logger.info('[CSV] Converting purchased items to CSV...');

	const soldItems = JSON.parse(fs.readFileSync(purchasedItemsLogFile, 'utf8'));
	const flattenedSoldItems = soldItems.map(obj => {
		obj.item?.stickers?.forEach(sticker => {
			const slot = sticker.slot;
			obj.item[`sticker${slot}_name`] = sticker.name;
			obj.item[`sticker${slot}_codename`] = sticker.codename;
			obj.item[`sticker${slot}_material`] = sticker.material;
			obj.item[`sticker${slot}_stickerId`] = sticker.stickerId;
		});

		// if any sticker slots don't exist, set them to N/A
		for(let i = 1; i <= 4; i++){
			if(!obj.item[`sticker${i}_name`]){
				obj.item[`sticker${i}_name`] = 'N/A';
			}
			if(!obj.item[`sticker${i}_codename`]){
				obj.item[`sticker${i}_codename`] = 'N/A';
			}
			if(!obj.item[`sticker${i}_material`]){
				obj.item[`sticker${i}_material`] = 'N/A';
			}
			if(!obj.item[`sticker${i}_stickerId`]){
				obj.item[`sticker${i}_stickerId`] = 'N/A';
			}
		}

		delete obj.item.stickers;

		obj.item.price = obj.item.price / 100;
		obj.item.askPrice = obj.item.askPrice / 100;
		obj.item.priceUsd = obj.item.priceUsd / 100;
		obj.item.askPriceUsd = obj.item.askPriceUsd / 100;
		// convert 1.15 to 15% markup
		obj.item.markupPercentage = (obj.item.markupPercentage - 1) * 100;
		obj.item.buffPrice = obj.item.buffPrice / 100;
		// 1.0267435989902634 = 102.67% buff
		obj.item.buffPercentage = obj.item.buffPercentage * 100;

		obj.purchasedAt = new Date(obj.purchasedAt).toLocaleString();
		obj.receivedAt = new Date(obj.receivedAt).toLocaleString();

		// if any keys are undefined, set them to N/A
		Object.keys(obj).forEach(key => {
			if(!obj[key]){
				obj[key] = 'N/A';
			}
		});

		return obj;
	});

	const fields = [
		{
			label: 'Listing ID',
			value: 'id'
		},
		{
			label: 'Item Name',
			value: 'item.name'
		},
		{
			label: 'Item App ID',
			value: 'item.appid'
		},
		{
			label: 'Item Context ID',
			value: 'item.contextid'
		},
		{
			label: 'Item Asset ID',
			value: 'item.assetid'
		},
		{
			label: 'Item Float',
			value: 'item.float'
		},
		{
			label: 'Item Price',
			value: 'item.price'
		},
		{
			label: 'Item Ask Price',
			value: 'item.askPrice'
		},
		{
			label: 'Item Price (USD)',
			value: 'item.priceUsd'
		},
		{
			label: 'Item Ask Price (USD)',
			value: 'item.askPriceUsd'
		},
		{
			label: 'Item Markup Percentage',
			value: 'item.markupPercentage'
		},
		{
			label: 'Item Buff Price',
			value: 'item.buffPrice'
		},
		{
			label: 'Item Buff Percentage',
			value: 'item.buffPercentage'
		},
		{
			label: 'Seller Steam ID',
			value: 'seller.steamId'
		},
		{
			label: 'Seller Name',
			value: 'seller.name'
		},
		{
			label: 'Seller Role',
			value: 'seller.role'
		},
		{
			label: 'Purchased At Date',
			value: 'purchasedAt'
		},
		{
			label: 'Received At Date',
			value: 'receivedAt'
		},
		{
			label: 'Sticker 1 Name',
			value: 'item.sticker1_name'
		},
		{
			label: 'Sticker 1 Codename',
			value: 'item.sticker1_codename'
		},
		{
			label: 'Sticker 1 Material',
			value: 'item.sticker1_material'
		},
		{
			label: 'Sticker 1 Sticker ID',
			value: 'item.sticker1_stickerId'
		},
		{
			label: 'Sticker 2 Name',
			value: 'item.sticker2_name'
		},
		{
			label: 'Sticker 2 Codename',
			value: 'item.sticker2_codename'
		},
		{
			label: 'Sticker 2 Material',
			value: 'item.sticker2_material'
		},
		{
			label: 'Sticker 2 Sticker ID',
			value: 'item.sticker2_stickerId'
		},
		{
			label: 'Sticker 3 Name',
			value: 'item.sticker3_name'
		},
		{
			label: 'Sticker 3 Codename',
			value: 'item.sticker3_codename'
		},
		{
			label: 'Sticker 3 Material',
			value: 'item.sticker3_material'
		},
		{
			label: 'Sticker 3 Sticker ID',
			value: 'item.sticker3_stickerId'
		},
		{
			label: 'Sticker 4 Name',
			value: 'item.sticker4_name'
		},
		{
			label: 'Sticker 4 Codename',
			value: 'item.sticker4_codename'
		},
		{
			label: 'Sticker 4 Material',
			value: 'item.sticker4_material'
		},
		{
			label: 'Sticker 4 Sticker ID',
			value: 'item.sticker4_stickerId'
		}
	];

	const json2csvParser = new Parser({ fields });
	const csv = json2csvParser.parse(flattenedSoldItems);

	const DATE = new Date().toJSON().split('T')[0];
	const csvPath = path.join(__dirname, '..', '..', 'output', `purchased_items_${DATE}.csv`);

	fs.writeFileSync(csvPath, csv);

	Logger.info(`[CSV] Successfully converted sold items to CSV! Path: ${csvPath}`);
};

convertSoldItemsToCsv();
convertPurchasedItemsToCsv();