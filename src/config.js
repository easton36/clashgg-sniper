const { version } = require('../package.json');

module.exports = {
	VERSION: version,

	MONGO_URI: process.env.MONGO_URI,

	CLASH_WS_URL: 'wss://ws.clash.gg/',
	CLASH_API_URL: 'https://clash.gg/api',

	REFRESH_TOKEN: process.env.REFRESH_TOKEN,
	CF_CLEARANCE: process.env.CF_CLEARANCE,

	PRICEMPIRE_API_URL: 'https://api.pricempire.com',
	PRICEMPIRE_API_KEY: process.env.PRICEMPIRE_API_KEY,
	ENABLE_PRICE_FETCH_ON_START: process.env.ENABLE_PRICE_FETCH_ON_START === 'true',
	PRICE_FETCH_INTERVAL: Number(process.env.PRICE_FETCH_INTERVAL),

	CLASH_COIN_CONVERSION: Number(process.env.CLASH_COIN_CONVERSION),

	ENABLE_ITEM_SNIPING: process.env.ENABLE_ITEM_SNIPING === 'true',

	MIN_PRICE: Number(process.env.MIN_PRICE) * 100,
	MAX_PRICE: Number(process.env.MAX_PRICE) * 100,

	MAX_MARKUP_PERCENT: Number(process.env.MAX_MARKUP_PERCENT),

	CHECK_BUFF_PRICE: process.env.CHECK_BUFF_PRICE === 'true',
	MAX_BUFF_PERCENT: Number(process.env.MAX_BUFF_PERCENT),

	ITEMS_TO_IGNORE: JSON.parse(process.env.ITEMS_TO_IGNORE),
	STRINGS_TO_IGNORE: JSON.parse(process.env.STRINGS_TO_IGNORE),

	ENABLE_BULK_SELL: process.env.ENABLE_BULK_SELL === 'true',
	INVENTORY_SELL_MARKUP_PERCENT: Number(process.env.INVENTORY_SELL_MARKUP_PERCENT),

	ENABLE_STEAM_LOGIN: process.env.ENABLE_STEAM_LOGIN === 'true',
	STEAM_USERNAME: process.env.STEAM_USERNAME,
	STEAM_PASSWORD: process.env.STEAM_PASSWORD,
	STEAM_SHARED_SECRET: process.env.STEAM_SHARED_SECRET,
	STEAM_IDENTITY_SECRET: process.env.STEAM_IDENTITY_SECRET,

	PLAY_GAME_APPID: process.env.PLAY_GAME_APPID,

	DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL
};