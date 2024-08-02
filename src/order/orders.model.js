const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    shippingDetails: {
            name: { type: String, required: true },
            address: { type: String, required: true },
            phoneNo: { type: String, required: true },
    },
    billingDetails: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phoneNo: { type: String, required: true },
},
    paymentMethod: { type: String, default: null},
    itemsList: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true , default:null},
        quantity: { type: Number, required: true  , default:1},
        price:{ type:Number, default: null},
        name:{ type: String, default: null}
    }],
    orderInstructions: { type: String, default: null },
    orderStatus: { type: String, required: true,default:"Pending" },
    subTotal: { type: Number },
    totalAmount: { type: Number },
    userId:{type: mongoose.Schema.Types.ObjectId,ref:"User", required:true,default:null},
    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
