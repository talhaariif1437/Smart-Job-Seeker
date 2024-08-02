const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('./orders.model');
const Product= require("../product/products.model")

//Middleware
const jwt = require("../middleware/jwt.js");
//validations
const checkCreateParams = require("./requests/create.js");
const checkUpdateparams = require("./requests/update.js");
//serviece
const OrderHelper = require("./orders.service.js");
const LogService = require("../log/log.service.js")
//Response Helpers

const {
    sendSuccessResponse,
    sendErrorResponse,
  } = require("../shared/response.service.js");
  


//Place Order
router.post("/placeOrder",jwt, checkCreateParams,async(req, res, next) => {
    try{
    const {shippingDetails,billingDetails,paymentMethod,itemsList,orderInstructions,isDeleted,deletedAt}= req.body;
     let userId = req.user.userId;
     console.log("req.user:", req.user);


    let subTotal = 0;
    let totalAmount = 0;
    let newArr=[]
    for(let item of itemsList){
        const product = await Product.findById(item.productId);
        console.log("product",product)
        if(!product){
            return res.status(404).json({message:"No product found"});
        }
        newArr.push({
            productId: item.productId,
            quantity: item.quantity,
            price:product.price,
            name:product.name
        })
        subTotal += product.price * item.quantity;        
    }   
    totalAmount = subTotal;

    const newOrder = new Order({ 
        _id: mongoose.Types.ObjectId(),
        shippingDetails,
        billingDetails,
        paymentMethod,
        itemsList:newArr,
        orderInstructions,
        orderStatus:"Pending",
        subTotal,
        totalAmount,
        userId,
        isDeleted,
        deletedAt
    })

const saveOrder = await newOrder.save();
let text="Order generated successfully"
let createdBy=userId
let log = await LogService.create(text,createdBy);
res.status(200).json({message:"Order placed Successfully", saveOrder})
}catch(err){
    console.log(err);
    res.status(500).json({message:"Inetrnal Server Error"})
}
})

//Order Update
router.patch("/:orderId",jwt, async(req,res,next) =>{
    let userId= req.user.userId;
    try{
        let orderId= req.params.orderId;
        
     await OrderHelper.findAndUpdate(orderId,req.body);

     let updatedOrder = await OrderHelper.findById(orderId);

    console.log(updatedOrder);
    let text="Order updated successfully"
    let createdBy=userId
    let log = await LogService.create(text,createdBy);
    res.status(200).json({ message: "Order updated successfully", updatedOrder });

    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Inetrnal Server Error"})
    }
})


//Show list of Order
// router.get("/", async(req,res,next)=>{
//     try{
//         console.log(req.query.search)
//         req.query.isDeleted=false;
//         if(req.query.search){
//             const searchRegex = new RegExp(req.query.search, 'i');
//             searchCriteria={
//                 $or:[
//                     {'paymentMethod':searchRegex},
//                     {'orderStatus':searchRegex},
//                     {'orderInstructions':searchRegex}
//                 ]
//             };
//             console.log(req.query);
//             let search=await Order.find(req.query)
//             console.log("Search results are: ",search)
//             req.query={...req.query, ...searchCriteria};
//             //Delete the Search parAMeter from the quer object
//             delete req.query.search;
//             console.log("After Delete query is: ",req.query);
//         }

//         let orders = await Order.find(req.query);
//         if(!orders){
//             return res.status(404).json({message:"Orders not found"});
//         }

//         res.status(200).json({message: "Orders found successfully", orders});
//     }
//     catch(err){
//         console.log(err)
//         res.status(500).json({message:"Inetrnal Server Error"})
//     }
// })
router.get("/list",jwt, async (req, res, next) => {
    console.log("in")
    let userId = req.user.userId;
    try{
        const request = req.query;
        let result = await OrderHelper.list(request.pageNo, request.searchValue,request.startDate,request.endDate,request.paymentMethod,request.orderStatus,request.orderInstructions);
        let text="Orders list request successful !"
        let createdBy=userId
        let log = await LogService.create(text,createdBy);
        return sendSuccessResponse(res, "Request Successful", result);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Internal server error"});
    }
  });



//Find order by User id
router.get("/user-orders/:userId", jwt,  async(req,res,next) =>{
    let userid= req.user.userId;
    try{
        let userId= req.params.userId;
        console.log("The user id is :",userId);
        let order= await Order.find({userId: userId});
        if(!order) return "User not found"

        let text="Order found against User Id !"
        let createdBy=userid;
        let log = await LogService.create(text,createdBy);
        res.status(200).json({ message: "The order are", order})
    }
    catch(err){
        console.log(err);
        res.status(500).json({ message: err.message });
    }
})
//Find Order by Id

router.get("/:orderId",jwt, async (req, res, next) => {
    let userId= req.user.userId;
    try {
        let orderId = req.params.orderId; 
        let order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // console.log(order)
        let text="Order found against Order Id !"
        let createdBy=userId
        let log = await LogService.create(text,createdBy);
        return res.status(200).json({ message: "Order found", order });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

//Delete Order by Id

router.delete("/:orderId",jwt, async(req,res,next) => {
    let userId =req.user.userId
    try{        
        let request =  req.params
        let orderId= request.orderId;
        if(!orderId) return sendErrorResponse(res, "Order Id is required");
         await Order.deleteOne({_id:orderId});
        if(!Order){
            return res.status(401).json({message: "Failed to delete the order"})
        }
        let text="Order deleted against Order ID successfully !"
        let createdBy=userId
        let log = await LogService.create(text,createdBy);
        res.status(200).json({message: "Order deleted successfully"})
    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal Server error"})
    }
})


//Order Status Update
router.patch("/:orderId/status", async (req, res, next) => {
    try {
        const orderId = req.params.orderId;

        await OrderHelper.findAndUpdate(orderId, req.body);

        const updatedStatus = await OrderHelper.findById(orderId);
        console.log(updatedStatus);
        res.status(200).json({ message: "Order status updated successfully", updatedStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});


// router.get("/",async(req,res)=>{
//     try{
//         req.query.isDeleted =false;
//         if(req.query.search){
//             let searchRegex=new RegExp(req.query.search,'i');
//             let searchCriteria = {
//                 $or:[
//                     {"orderStaus":searchRegex},
//                     {"orderInstructions":searchRegex},
//                     {"paymentMethod":searchRegex},
//                 ]
//             };
//             let search = await Order.find(searchCriteria);
//             if(!search){
//                 return res.status(404).json({message:"No search results found"})
//             }

//             req.query= {...req.query,...searchCriteria};

//             delete req.query.search;

//             // let orders= await Order.find(req.query);
//             const { orders, totalRecords, page, limit } = await OrderHelper.getPaginatedOrders(searchCriteria, req.query.page, req.query.limit);
//             if(!orders){
//                 return res.status(404).json({message:"No orders found"})
//             }
//             res.status(200).json({message:"Orders are",orders})
//         }
//     }
//     catch(err){
//         console.log(err);
//         res.status(500).json({ message: "Internal server error" });
//     }
// })








// List entities
// router.get("/list",jwt, async (req, res, next) => {
//     console.log("in")
//     let userId = req.user.userId;
//     try{
//         const request = req.query;
//         let result = await OrderHelper.list(request.pageNo, request.searchValue,request.startDate,request.endDate,request.paymentMethod,request.orderStatus,request.orderInstructions);
//         // let text="Orders list request successful !"
//         // let createdBy=userId
//         // let log = await LogService.create(text,createdBy);
//         return sendSuccessResponse(res, "Request Successful", result);
//     }
//     catch(error){
//         console.log(error);
//         res.status(500).json({message:"Internal server error"});
//     }
//   });




module.exports = router;