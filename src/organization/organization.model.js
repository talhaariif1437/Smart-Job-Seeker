const mongoose = require("mongoose");
const organizationSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,  default: "",},
    email: {
      type: String,
      default: "",
    },

    location: { type: String,   default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
      min: 0,
      max: 14,
    },
    website: {
      type: String,
      default: "",
    },

    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Organization", organizationSchema);
