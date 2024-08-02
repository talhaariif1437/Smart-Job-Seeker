const mongoose = require("mongoose");
const Log = require("./log.model");
const moment = require("moment");

const GeneralHelper = require("../shared/GeneralHelper");



exports.create = async(
    text,
    createdBy
)=>{
    const log = new Log({
        _id: new mongoose.Types.ObjectId(),
        text,
        createdBy
    })
    return await log.save();
}

exports.delete = async(id)=>{
  await Log.deleteOne({_id:id});
}

//Specific User list
exports.list = async (pageNo = 1, searchValue = "", startDate = null , endDate = null,userId=null) => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
    let condition = [{ deletedAt:null}];
    if(userId!=null)
    condition[0].createdBy=userId ;
console.log("Condition is:", condition);
    console.log(startDate,endDate)
  if(startDate){
    startDate = new Date(startDate)
  }
  if(endDate){
    endDate = new Date(endDate);
    endDate.setHours(23, 59,59,999)
  }

  if (startDate != null) {
    condition.push({
      createdAt: {
        $gte: startDate 
      }
    });
  }
else if (endDate) {
    condition.push({
      createdAt: {
        $lte: endDate
      }
    });
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
    console.log(condition)
    let result = await Log.find(condition)
      .sort({ _id: -1 })
      .skip(pg.skip)
      .limit(pg.pageSize)
      .exec();
  
    const total = await Log.find(condition).countDocuments();
  
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


