// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const Job = require("./job.model");
const User = require("../user/user.model");
const { name } = require("ejs");

//Helper
const GeneralHelper = require("../shared/GeneralHelper");

exports.list = async (pageNo = 1, searchValue = "", startDate = null , endDate = null) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);

  let condition = [{ deletedAt: null }];

  if (searchValue) {
    const regex = GeneralHelper.makeRegex(searchValue);
    condition.push({
      $or: [
        {
          name: regex,
        },
        { description: regex }

      ],
    });
  }
if(startDate){
  startDate = new Date(startDate)
  startDate.setHours(0, 0, 0, 0)
}
if(endDate){
  endDate = new Date(endDate);
  endDate.setHours(23, 59,59,999)
}
if(startDate && endDate){
  condition.push({
    createdAt:{
      $gte: startDate,
      $lte: endDate
    }
  })
}
  condition = { $and: condition };
  let result = await Job.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  const total = await Job.find(condition).countDocuments();

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

exports.recommendedJobList = async (userId, pageNo = 1, searchValue = "", startDate = null, endDate = null) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
  
    let condition = [{ deletedAt: null }];
  
    if (searchValue) {
      const regex = GeneralHelper.makeRegex(searchValue);
      condition.push({
        $or: [
          { name: regex },
          { description: regex }
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
          $lte: endDate,
        },
      });
    }
  
    // Fetch user skills and add skill matching condition
    let user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    console.log("User skills are:", user.skills);
    condition.push({
      skills: { $in: user.skills }
    });
  
    condition = { $and: condition };
  
    let result = await Job.find(condition)
      .sort({ _id: -1 })
      .skip(pg.skip)
      .limit(pg.pageSize)
      .exec();
  
    const total = await Job.find(condition).countDocuments();
  
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
  
exports.internationalJobList = async (userId, pageNo = 1, searchValue = "", startDate = null, endDate = null) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
  
    let condition = [{ deletedAt: null }];
  
    if (searchValue) {
      const regex = GeneralHelper.makeRegex(searchValue);
      condition.push({
        $or: [
          { name: regex },
          { description: regex }
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
          $lte: endDate,
        },
      });
    }
  
    // Fetch user skills and add skill matching condition
    let user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    console.log("User skills are:", user.country);
    condition.push({
      country: { $ne: user.country }
    });
  
    condition = { $and: condition };
  
    let result = await Job.find(condition)
      .sort({ _id: -1 })
      .skip(pg.skip)
      .limit(pg.pageSize)
      .exec();
  
    const total = await Job.find(condition).countDocuments();
  
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
  return await Job.findOne({ name: { $regex: regex }, deletedAt: null });
};

exports.findById = async (_id) => {
  return await Job.findOne({ _id: _id });
};

exports.findAll = async () => {
  return await Job.find();
};

exports.update = async (findObj, setObj) => {
  return await Job.updateOne(findObj, { $set: setObj });
};

exports.findAndUpdate = async (id, obj, imagePaths, userId) => {
  const updateObj = { ...obj, productImage: imagePaths, updatedBy: userId };
  return await Job.findByIdAndUpdate(id, updateObj);
};

exports.create = async (
  title,
  companyName,
  description,
  type,
  positions,
  education,
  experience,
  industry,
  skills,
  salary,
  startDate,
  endDate,
  organiationId,
  country,
  state,
  city,
  zip

) => {
  const job = new Job({
    _id: new mongoose.Types.ObjectId(),
    title,
    companyName,
    description,
    type,
    positions,
    education,
    experience,
    industry,
    skills,
    salary,
    startDate,
    endDate,
    organiationId,
    country,
    state,
    city,
    zip
  });
  return await job.save();
};

exports.delete = async (id) => {
  let updateInfo = {
    deletedAt: moment(),
  };
  await Job.updateOne({ _id: id }, { $set: updateInfo }).exec();
};
