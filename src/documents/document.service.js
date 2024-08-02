// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const Document = require("./document.model");

//Helpers
const GeneralHelper = require("../shared/GeneralHelper");

exports.getParentChildList = async (pageNo = 1, searchValue, origindate) => {
  const pageSize = 10; // Example page size

  const matchConditions = [
    { parent: null }, // Filter only parent documents
    { isDeleted: false }, // Optionally, filter out deleted documents
  ];

  if (searchValue) {
    // Add searchValue filter

    const regex = GeneralHelper.makeRegex(searchValue);

    matchConditions.push({
      $or: [
        { name: { $regex: regex } }, // Case-insensitive search on name field
        { description: { $regex: regex } }, // Case-insensitive search on description field
      ],
    });
  }
  console.log("before condition", origindate);

  if (origindate) {
    const dateObject = new Date(origindate);
    const year = dateObject.getFullYear();
    const month = dateObject.getMonth() + 1; // Month is zero-based, so add 1
    const day = dateObject.getDate();

    // Create a formatted date string (YYYY-MM-DD)
    const formattedDate = `${year}-${month < 10 ? "0" + month : month}-${
      day < 10 ? "0" + day : day
    }`;
    console.log("After convertion :", formattedDate);
    matchConditions.push({ createdAt: origindate });
  }

  const aggregationPipeline = [
    {
      $match: { $and: matchConditions },
    },
    {
      $lookup: {
        from: "documents",
        localField: "_id",
        foreignField: "parent",
        as: "children",
      },
    },
    {
      $skip: (pageNo - 1) * pageSize, // Calculate skip count based on page number and page size
    },
    {
      $limit: pageSize, // Limit the number of documents returned per page
    },
  ];

  const documents = await Document.aggregate(aggregationPipeline);

  // You can further fetch the total count of documents to calculate pagination details
  const totalCount = await Document.countDocuments({
    parent: null,
    isDeleted: false,
  });

  const totalPages = Math.ceil(totalCount / pageSize);
  const paginationDetails = {
    currentPage: pageNo,
    pageSize: pageSize,
    totalPages: totalPages,
    totalCount: totalCount,
  };

  return {
    pagination: paginationDetails,
    data: documents,
  };
};

exports.list = async (startDate = null, endDate = null) => {
  let Condition = [{ deletedAt: null }];

  if (startDate) {
    startDate = new Date(startDate);
    startDate.setHours(0, 0, 0, 0);
  }
  if (endDate) {
    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);
  }
  if (startDate && endDate) {
    Condition.push({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });
  }
  Condition = { $and: Condition };

  return await Document.find(Condition).sort({ _id: -1 }).exec();
};

exports.findByTitle = async (name) => {
  let regex = new RegExp(name.trim(), "i");
  return await Document.findOne({ name: { $regex: regex }, deletedAt: null });
};

exports.findById = async (_id) => {
  return await Document.findOne({ _id: _id });
};

exports.findAll = async () => {
  return await Document.find({});
};

exports.update = async (findObj, setObj) => {
  return await Document.updateOne(findObj, { $set: setObj });
};

exports.findAndUpdate = async (id, obj, filepath, userId) => {
  const updateObj = { ...obj, file: filepath, updatedBy: userId };
  return await Document.findByIdAndUpdate(id, updateObj);
};

exports.create = async (name, description, parent, file, createdBy) => {
  const document = new Document({
    _id: new mongoose.Types.ObjectId(),
    name,
    description,
    parent,
    file,
    createdBy,
  });
  return await document.save();
};

exports.delete = async (id) => {
  let updateInfo = {
    deletedAt: moment(),
  };
  await Document.updateOne({ _id: id }, { $set: updateInfo }).exec();
};
