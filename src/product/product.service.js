// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const Product = require("./products.model");
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
        { description: regex },
        {
          price: regex,
        },
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
  let result = await Product.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  const total = await Product.find(condition).countDocuments();

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
  return await Product.findOne({ name: { $regex: regex }, deletedAt: null });
};

exports.findById = async (_id) => {
  return await Product.findOne({ _id: _id });
};

exports.findAll = async () => {
  return await Product.find();
};

exports.update = async (findObj, setObj) => {
  return await Product.updateOne(findObj, { $set: setObj });
};

exports.findAndUpdate = async (id, obj, imagePaths, userId) => {
  const updateObj = { ...obj, productImage: imagePaths, updatedBy: userId };
  return await Product.findByIdAndUpdate(id, updateObj);
};

exports.create = async (
  name,
  price,
  picture,
  description,
  productImage,
  category,
  createdBy
) => {
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name,
    price,
    picture,
    description,
    productImage,
    category,
    createdBy,
  });
  return await product.save();
};

exports.delete = async (id) => {
  let updateInfo = {
    deletedAt: moment(),
  };
  await Product.updateOne({ _id: id }, { $set: updateInfo }).exec();
};
