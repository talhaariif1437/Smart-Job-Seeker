// Mongoose
const mongoose = require("mongoose");

// Moment
const moment = require("moment");

const GeneralHelper = require("../shared/GeneralHelper");



// Models
const Order = require("./orders.model");
exports.findAndUpdate = async (id, obj) => {
   
    return await Order.findByIdAndUpdate(id, obj);
  };

  exports.findById = async (_id) => {
    return await Order.findOne({ _id: _id });
  };
  

exports.list = async (pageNo = 1, searchValue = "", startDate = null , endDate = null,paymentMethod="",orderStatus="", orderInstructions="") => {
    let pg = GeneralHelper.getPaginationDetails(pageNo);
  
    let condition = [{ deletedAt: null }];
    console.log(startDate,endDate)
    if (searchValue) {
      const regex = GeneralHelper.makeRegex(searchValue);
      condition.push({
        $or: [
          {
            paymentMethod: regex,
          },
          { orderStatus: regex },
          {
            orderInstructions: regex,
          },
        ],
      });
    }
    if(paymentMethod!= ""){
        console.log("in")
        condition.push({
            paymentMethod:{ $regex:paymentMethod, $options: 'i'},
        })
    }
    if(orderStatus!= ""){
        console.log("in")
        condition.push({
            orderStatus: {$regex:orderStatus, $options:'i'},
        })
    }
    if(orderInstructions!= ""){
        console.log("in")
        condition.push({
            orderInstructions:{$regex: orderInstructions, $options:'i'},
        })
    }
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
    let result = await Order.find(condition)
      .sort({ _id: -1 })
      .skip(pg.skip)
      .limit(pg.pageSize)
      .exec();
  
    const total = await Order.find(condition).countDocuments();
  
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
