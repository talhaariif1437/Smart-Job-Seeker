const multer = require('multer');
const path = require('path');
// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

// Models
const User = require("./user.model");

// Helpers
const GeneralHelper = require("../shared/GeneralHelper");




// Configure multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'), false);
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: {
    filesize: 1024 * 1024 * 2 
  },
  fileFilter: fileFilter
});

// Express setup (example)
const express = require('express');
const app = express();

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Only .jpeg, .jpg, and .png files are allowed!');
  }
  res.send('File uploaded successfully');
});




exports.list = async (
  userId,
  // userRole,
  pageNo = 1,
  searchValue = null
) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  // console.log("user Role:", userRole);
  let condition = [
    // { organization: organizationId },
    // { type: userRole },
    { deletedAt: "" },
  ];

  if (searchValue) {
    const regex = GeneralHelper.makeRegex(searchValue);
    condition.push({
      $or: [
        {
          name: regex,
        },
        { email: regex },
      ],
    });
  }

  condition = { $and: condition };
  let result = await User.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await User.find(condition).countDocuments();

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

// Companies Paginated List

exports.companiesList = async (
  userId,
  pageNo = 1,
  searchValue = null
) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  // console.log("user Role:", userRole);
  let condition = [
    { role: "2" },
    { deletedAt: "" },
  ];

  if (searchValue) {
    const regex = GeneralHelper.makeRegex(searchValue);
    condition.push({
      $or: [
        {
          name: regex,
        },
        { email: regex },
      ],
    });
  }

  condition = { $and: condition };
  let result = await User.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await User.find(condition).countDocuments();

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

exports.timeExchangeUsers = async (
  userId,
  pageNo = 1,
  searchValue = null
) => {
  let pg = GeneralHelper.getPaginationDetails(pageNo);
  // console.log("user Role:", userRole);
  let condition = [
    {role: '2'},
    { timeExchangeDescription: { $ne: null, $ne: "" } },
    { availableFrom: { $ne: null, $ne: "" } },
    { availableTill: { $ne: null, $ne: "" } }
  ];

  if (searchValue) {
    const regex = GeneralHelper.makeRegex(searchValue);
    condition.push({
      $or: [
        {
          name: regex,
        },
        { email: regex },
      ],
    });
  }

  condition = { $and: condition };
  let result = await User.find(condition)
    .sort({ _id: -1 })
    .skip(pg.skip)
    .limit(pg.pageSize)
    .exec();

  let total = await User.find(condition).countDocuments();

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


exports.findByEmail = async (email) => {
  return await User.findOne({
    email: email.trim().toLowerCase(),
    deletedAt: null,
  });
};

exports.findById = async (_id) => {
  return await User.findOne({ _id: _id });
};

exports.findAll = async () => {
  return await User.find();
};

exports.findByRole = async (business, role) => {
  return await User.findOne({ business: business, role: role });
};

exports.findUserIdByRole = async (business, role) => {
  return await User.find({ business: business, role: role }).distinct("_id");
};

// exports.update = async (findObj, setObj) => {
//   console.log(findObj,setObj)
//   return await User.updateOne({_id:findObj.userId}, { $set: setObj });
// };

exports.update = async (findObj, setObj) => {
  // console.log(findObj, setObj);

  let user = await User.findOne({ _id: findObj.userId });
  console.log("USer found is",findObj.userId)
  if (!user) {
    throw new Error('User not found');
  }
  
  // Merge existing user data with the provided data
  Object.assign(user, setObj);
  
  return await user.save();
};


exports.updateById = async (userId, updateFields) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    // Update user fields
    Object.assign(user, updateFields);
    // Save the updated user
    await user.save();
    return user;
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
};

exports.totalRegisteredByRole = async (business, role) => {
  return await User.find({
    business: business,
    role: role,
    isDeleted: false,
  }).countDocuments();
};

exports.totalRegisteredByBusiness = async (business) => {
  return await User.find({
    business: business,
    isDeleted: false,
  }).countDocuments();
};

exports.getUserName = async (user) => {
  return `${user.details.firstName} ${user.details.lastName}`;
};

exports.create = async (
  name,
  email,
  password,
  // firstTimeToken = null,
  role=null
) => {
  console.log("inSService")
  const hashPassword = await GeneralHelper.bcryptPassword(password);
  
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: name,
    email: email.trim().toLowerCase(),
    password: hashPassword,
    role: role,
    // cnicNo: cnicNo,
    // firstTimeToken: firstTimeToken,
  });
  return await user.save();
};

exports.createAdmin = async (
  name,
  email,
  password,
  organizationId
) => {
  console.log("inSService",name,email,password,organizationId)
  const hashPassword = await GeneralHelper.bcryptPassword(password);
  
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: name,
    email: email.trim().toLowerCase(),
    password: hashPassword,
    organizationId: organizationId
  });
  return await user.save();
};
exports.delete = async (id) => {
  let updateInfo = {
    isDeleted: true,
    deletedAt: moment(),
  };

  await User.updateOne({ _id: id }, { $set: updateInfo }).exec();
};

exports.upload= upload;