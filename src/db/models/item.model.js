const mongoose = require('mongoose');

module.exports = mongoose.model('item', new mongoose.Schema({
	name: {
		type: String,
		required: true,
		index: true
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
		},
		// doppler phase 1
		buff_p1: {
			type: Number,
			required: false
		},
		buff_p1_quick: {
			type: Number,
			required: false
		},
		buff_p1_avg7: {
			type: Number,
			required: false
		},
		buff_p1_avg30: {
			type: Number,
			required: false
		},
		// doppler phase 2
		buff_p2: {
			type: Number,
			required: false
		},
		buff_p2_quick: {
			type: Number,
			required: false
		},
		buff_p2_avg7: {
			type: Number,
			required: false
		},
		buff_p2_avg30: {
			type: Number,
			required: false
		},
		// doppler phase 3
		buff_p3: {
			type: Number,
			required: false
		},
		buff_p3_quick: {
			type: Number,
			required: false
		},
		buff_p3_avg7: {
			type: Number,
			required: false
		},
		buff_p3_avg30: {
			type: Number,
			required: false
		},
		// doppler phase 4
		buff_p4: {
			type: Number,
			required: false
		},
		buff_p4_quick: {
			type: Number,
			required: false
		},
		buff_p4_avg7: {
			type: Number,
			required: false
		},
		buff_p4_avg30: {
			type: Number,
			required: false
		},
		// doppler ruby
		buff_ruby: {
			type: Number,
			required: false
		},
		buff_ruby_quick: {
			type: Number,
			required: false
		},
		buff_ruby_avg7: {
			type: Number,
			required: false
		},
		buff_ruby_avg30: {
			type: Number,
			required: false
		},
		// doppler sapphire
		buff_sapphire: {
			type: Number,
			required: false
		},
		buff_sapphire_quick: {
			type: Number,
			required: false
		},
		buff_sapphire_avg7: {
			type: Number,
			required: false
		},
		buff_sapphire_avg30: {
			type: Number,
			required: false
		},
		// doppler black pearl
		buff_bp: {
			type: Number,
			required: false
		},
		buff_bp_quick: {
			type: Number,
			required: false
		},
		buff_bp_avg7: {
			type: Number,
			required: false
		},
		buff_bp_avg30: {
			type: Number,
			required: false
		},
		// gamma doppler emerald
		buff_emerald: {
			type: Number,
			required: false
		},
		buff_emerald_quick: {
			type: Number,
			required: false
		},
		buff_emerald_avg7: {
			type: Number,
			required: false
		},
		buff_emerald_avg30: {
			type: Number,
			required: false
		}
	}
}, {
	timestamps: true
}));