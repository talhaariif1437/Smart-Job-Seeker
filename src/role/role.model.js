const mongoose = require('mongoose');

const roleSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	title: { type: String, required: true },
	deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);