const mongoose = require('mongoose');
const organizationModel = require("../organization/organization.model");

const jobSchema = mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    title:{type:String,default:null},
    companyName:{type:String,default:null},
    description:{type:String,default:null},
    type:{type:String,default:null},
    positions:{type:Number,default:null},
    education: { type: Array, default: null },
    experience:[{ type: String, default: null}],
    industry:{type:String,default:null},
    skills: [{ type: String, default: null }],
    salary:{type: Number, default: null },
    startDate:{type:Date, default:null},
    endDate:{type:Date, default:null},
    organizationId:{type:mongoose.Schema.ObjectId,ref:"User",default:null},
    country: { type: String, default: null },
    state: { type: String, default: null },
    city: { type: String, default: null },
    zip: { type: String, default: null },
    viewCount:{ type: Number, default:0}

},{timestamps: true}
);

module.exports = mongoose.model("Job",jobSchema);