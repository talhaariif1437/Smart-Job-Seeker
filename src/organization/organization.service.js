// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const Organization = require("./organization.model");
//Helpers
const GeneralHelper = require("../shared/GeneralHelper");

exports.list = async (pageNo = 1, searchValue = null, startDate = null, endDate = null) => {
  const pg = GeneralHelper.getPaginationDetails(pageNo);
  let condition = [{ deletedAt: null }];

  if (searchValue) {
    const regex = GeneralHelper.makeRegex(searchValue);
    condition.push({$or: [
        {
          name: regex,
        },
        { email: regex },
        { location: regex },
        { phoneNumber: regex },
        { website: regex },
      ]})
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

  const result = await Organization.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  const total = await Organization.find(condition).countDocuments();

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
  return await Organization.findOne({
    name: { $regex: regex },
    deletedAt: null,
  });
};

exports.findById = async (_id) => {
  return await Organization.findOne({ _id: _id });
};

exports.findAll = async () => {
  return await Organization.find({});
};

exports.update = async (findObj, setObj) => {
  return await Organization.updateOne(findObj, { $set: setObj });
};

exports.findAndUpdate = async (id, obj) => {
  return await Organization.findByIdAndUpdate(id, obj);
};

exports.create = async (name, email, location, phoneNumber, website) => {
  console.log(email.trim())
  console.log(email.trim().toLowerCase())
  const organization = new Organization({
    _id: new mongoose.Types.ObjectId(),
    name,
    email:email.trim().toLowerCase(),
    location,
    phoneNumber,
    website,
  });
  return await organization.save();
};

exports.delete = async (id) => {
  let updateInfo = {
    deletedAt: moment(),
  };
  await Organization.updateOne({ _id: id }, { $set: updateInfo }).exec();
};
