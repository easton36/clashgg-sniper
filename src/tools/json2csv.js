const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const Logger = require('../utils/logger.util');

/**
 * Get CSV fields
 */
const getFields = (transactionType) => {
	const initialCommonFields = [
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
		}
	];

	const transactionSpecificFields = transactionType === 'sold'
		? [
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
			}
		]
		: [
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
			}
		];

	const finalCommonFields = [
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

	return [...initialCommonFields, ...transactionSpecificFields, ...finalCommonFields];
};

/**
 * Processes items
 */
const processItems = (items) => items.map(obj => {
	obj.item?.stickers?.forEach(sticker => {
		const slot = sticker.slot;
		obj.item[`sticker${slot}_name`] = sticker.name;
		obj.item[`sticker${slot}_codename`] = sticker.codename;
		obj.item[`sticker${slot}_material`] = sticker.material;
		obj.item[`sticker${slot}_stickerId`] = sticker.stickerId;
	});

	// if any sticker slots don't exist, set them to N/
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
	// for sell logs
	if(obj.soldAt) obj.soldAt = new Date(obj.soldAt).toLocaleString();
	// for purchase logs
	if(obj.purchasedAt) obj.purchasedAt = new Date(obj.purchasedAt).toLocaleString();
	if(obj.receivedAt) obj.receivedAt = new Date(obj.receivedAt).toLocaleString();

	// if any keys are undefined, set them to N/A
	Object.keys(obj).forEach(key => {
		if(!obj[key]){
			obj[key] = 'N/A';
		}
	});

	return obj;
});

/**
 * Converts items to CSV
 * @param {String} transactionType - Either "sold" or "purchased"
 */
const convertItemsToCsv = async (transactionType) => {
	Logger.info(`[CSV] Converting ${transactionType} items to CSV...`);

	const logFile = path.join(__dirname, '..', '..', 'logs', `${transactionType}_items.json`);

	const items = JSON.parse(fs.readFileSync(logFile, 'utf8'));
	const flattenedItems = processItems(items);

	const fields = getFields(transactionType);

	const json2csvParser = new Parser({ fields });
	const csv = json2csvParser.parse(flattenedItems);

	const DATE = new Date().toJSON().split('T')[0];
	const csvPath = path.join(__dirname, '..', '..', 'output', `${transactionType}_items_${DATE}.csv`);

	fs.writeFileSync(csvPath, csv);

	Logger.info(`[CSV] Successfully converted ${transactionType} items to CSV! Path: ${csvPath}`);
};

convertItemsToCsv('sold');
convertItemsToCsv('purchased');