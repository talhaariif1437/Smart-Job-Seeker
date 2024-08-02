// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require('moment');

// Models
const Role = require("./role.model");

exports.list = async () => {

	let roleCondition = [{ deletedAt: null }];

	roleCondition = { $and: roleCondition }

	return await Role.find(roleCondition).sort({ _id: -1 }).exec();
}

exports.findByTitle = async (title) => {
	let regex = new RegExp(title.trim(), 'i');
	return await Role.findOne({ title: { $regex: regex }, deletedAt: null });
}

exports.findById = async (_id) => {
	return await Role.findOne({ _id: _id });
}

exports.update = async (findObj, setObj) => {
	return await Role.updateOne(findObj, { $set: setObj });
}

exports.create = async (title) => {

	const role = new Role({
		_id: new mongoose.Types.ObjectId(),
		title: title.trim(),
	});
	return await role.save();
}

exports.delete = async (id) => {
	let updateInfo = {
		deletedAt: moment()
	}
	await Role.updateOne({ _id: id }, { $set: updateInfo }).exec();
}