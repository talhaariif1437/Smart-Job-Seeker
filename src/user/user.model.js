const mongoose = require("mongoose");
const organizationModel = require("../organization/organization.model");

const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, default:null},
    email: { type: String, default:null},
    password: { type: String},
    cnicNo: { type: String, default: null},
    dob: { type: Date, default: null },
    phoneNo:{ type: String, default: null},
    gender:{ type: String, default: null},
    address: { type: String, default: null },
    hobby: [{ type: String, default: null }],
    role:{ type: String, default: "3",enum:["2","3","1"]},
    experience:[{ type: String, default: null}],
    profilePicture: { type: String, default: "default.jpg" },
    education: { type: Array, default: null },
    skills: [{ type: String, default: null }],
    projects: [{ type: String, default: null }],
    timeExchangeDescription: { type: String, default: null },
    expectedSalary: { type: Number, default: null },
    currentJob: { type: String, default: null },
    profileStatus: { type: Boolean, default: null },
    isVerified: { type: Boolean, required:false, default: false},
    resetToken: { type: String, default: null },
    resetTokenExpiration: { type: Date, default: null },
    // organizationId:{type:mongoose.Schema.ObjectId,ref:"Organization",default:null},
    country: { type: String, default: null },
    city:{ type: String, default: null },
    state:{ type: String, default: null },
    website:{ type: String, default: null },
    industry:{ type: String, default: null },
    description:{ type: String, default: null },
    availableTill: { type: Date, default: null },
    availableFrom: { type: Date, default: null },
    summary:{ type: String, default: null },
    employeeNo:{ type: Number, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
