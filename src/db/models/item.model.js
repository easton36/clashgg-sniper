const mongoose = require('mongoose');

module.exports = mongoose.model('item', new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	prices: {
		buff163: {
			sourcePrice: Number,
			sourceCurrency: String,
			price: Number,
			createdAt: String
		},
		buff163_quick: {
			sourcePrice: Number,
			sourceCurrency: String,
			price: Number,
			createdAt: String
		}
	}
}, {
	timestamps: true
}));