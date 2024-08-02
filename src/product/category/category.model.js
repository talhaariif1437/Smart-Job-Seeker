const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	name: { type: String, required: true },
    createdBy:{type:mongoose.Schema.ObjectId,
	ref:"User",
	default:null},
	updatedBy:{type:mongoose.Schema.ObjectId,ref:"User",default:null},
	deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);