const mongoose = require('mongoose');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const Item = require('./models/item.model');

/**
 * Connects to the MongoDB database
 */
const connect = async () => {
	try{
		await mongoose.connect(CONFIG.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});

		return Logger.info(`[MONGO] Connected to the MongoDB database at ${CONFIG.MONGO_URI}`);
	} catch(err){
		return Logger.error(`[MONGO] An error occurred while connecting to the MongoDB database: ${err.message || err}`);
	}
};

module.exports = {
	connect,

	Item
};