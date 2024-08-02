// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const Department = require("./department.model");

//Helpers
const GeneralHelper = require("../shared/GeneralHelper");

exports.list = async (pageNo = 1, searchValue = null, startDate = null , endDate = null) => {
  const pg = GeneralHelper.getPaginationDetails(pageNo);

  let condition = [{ deletedAt: null }];
  if (searchValue) {
    const regex = GeneralHelper.makeRegex(searchValue);
    condition.push({
      title: regex,
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
  const result = await Department.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();
  const total = await Department.find(condition).countDocuments();

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

exports.findByTitle = async (title) => {
  let regex = new RegExp(title.trim(), "i");
  return await Department.findOne({
    title: { $regex: regex },
    deletedAt: null,
  });
};

exports.findById = async (_id) => {
  return await Department.findOne({ _id: _id });
};

exports.findAll = async () => {
  return await Department.find({});
};

exports.update = async (findObj, setObj) => {
  return await Department.updateOne(findObj, { $set: setObj });
};

exports.create = async (title) => {
  const department = new Department({
    _id: new mongoose.Types.ObjectId(),
    title: title.trim(),
  });
  return await department.save();
};

exports.delete = async (id) => {
  let updateInfo = {
    deletedAt: moment(),
  };
  await Department.updateOne({ _id: id }, { $set: updateInfo }).exec();
};
