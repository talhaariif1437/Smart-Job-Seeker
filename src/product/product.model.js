const number = require("joi/lib/types/number");
const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    productImage: { type: Array, required: true },
    createdBy: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.ObjectId, ref: "User", default: null },
    category:{type:mongoose.Schema.ObjectId,ref:"Category",defualt:null},

    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
