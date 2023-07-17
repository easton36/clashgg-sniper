const mongoose = require('mongoose');

module.exports = mongoose.model('item', new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	prices: {
		buff163: {
			type: Number,
			required: false
		},
		buff163_quick: {
			type: Number,
			required: false
		},
		buff163_avg7: {
			type: Number,
			required: false
		},
		buff163_avg30: {
			type: Number,
			required: false
		}
	}
}, {
	timestamps: true
}));