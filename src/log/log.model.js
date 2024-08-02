const mongoose = require('mongoose');

const logSchema= mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    createdBy: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
    text:{type:String, default:null},
    deletedAt:{type:Boolean, default:null},
    isDeleted:{type:Boolean, default:false}
},{timestamp:true});
module.exports = mongoose.model("Log",logSchema);