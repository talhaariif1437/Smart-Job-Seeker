// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const Category = require("./category.model");
//Helper
const GeneralHelper = require("../../shared/GeneralHelper");

exports.list = async (pageNo = 1, searchValue = null, startDate= null, endDate = null) => {
	const pg = GeneralHelper.getPaginationDetails(pageNo);

	let condition = [{ deletedAt: null }];
	if (searchValue) {
		const regex = GeneralHelper.makeRegex(searchValue);
		condition.push({
			$or: [
				{
					name: regex,
				},
			],
		});
	}
	if (startDate) {
		startDate = new Date(startDate);
		startDate.setHours(0, 0, 0, 0);
	  }
	  if (endDate) {
		endDate = new Date(endDate);
		endDate.setHours(23, 59, 59, 999);
	  }
	  if (startDate && endDate) {
		condition.push({
		  createdAt: {
			$gte: startDate,
			$lte: endDate
		  }
		});
	  }
	condition = { $and: condition };
	let result = await Category.find(condition)
		.sort({ id: -1 })
		.skip(pg.skip)
		.limit(pg.pageSize)
		.exec();

	const total = await Category.find(condition).countDocuments();

	return {
		pagination: GeneralHelper.makePaginationObject(
			pg.pageNo,
			pg.pageSize,
			pg.skip,
			total,
			result.length
		),
		data: result,
	};
};

exports.findByTitle = async (name) => {
	let regex = new RegExp(name.trim(), "i");
	return await Category.findOne({ name: { $regex: regex }, deletedAt: null });
};

exports.findById = async (_id) => {
	return await Category.findOne({ _id: _id });
};

exports.update = async (findObj, setObj) => {
	return await Category.updateOne(findObj, { $set: setObj });
};

exports.create = async (title, userId) => {
	const category = new Category({
		_id: new mongoose.Types.ObjectId(),
		name: title.trim(),
		createdBy: userId,
	});
	return await category.save();
};

exports.delete = async (id) => {
	let updateInfo = {
		deletedAt: moment(),
	};
	await Category.updateOne({ _id: id }, { $set: updateInfo }).exec();
};
