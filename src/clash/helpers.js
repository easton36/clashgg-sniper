/**
 * Formats some listing JSON into human-readable text
 * @param {Object} data - The listing to format
 * @param {Boolean} ignored - Whether or not the listing is ignored
 * @returns {String} The formatted listing
 */
const formatListing = (data, ignored) => {
	let itemString = `ID: ${data?.id} Item Name: ${data.item?.name}, Item Price: ${data.item?.price}, Item Ask Price: ${data.item?.askPrice}, Item Markup: ${data?.item?.askPrice / data?.item?.price}`;
	if(data?.message){
		itemString += `, Message: ${data.message}`;
	}

	if(ignored) return itemString;

	return itemString + `\n\t\t\tItem Float: ${data.item?.float || 'N/A'}, Item Stickers: ${data.item?.stickers?.map(sticker => `Slot ${sticker.slot}: ${sticker.name}`).join(', ') || 'None'}`;
};

module.exports = {
	formatListing
};