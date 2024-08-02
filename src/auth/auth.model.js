const mongoose = require("mongoose");
const authSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, default: null },
    status: { type: Boolean, default: false },
    expiration: { type: Date, default: null },
  },
  { timestamps: true }
);
module.exports = mongoose.model("TwoFactorAuth", authSchema);
