const mongoose = require('mongoose');

const Logger = require('../utils/logger.util');
const CONFIG = require('../config');

const Item = require('./models/item.model');

/**
 * Connects to the MongoDB database
 */
const connect = async () => {
	await mongoose.connect(CONFIG.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	});

	return Logger.info(`[MONGO] Connected to the MongoDB database at ${CONFIG.MONGO_URI}`);
};

module.exports = {
	connect,

	// models
	Item
};