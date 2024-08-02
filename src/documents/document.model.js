const number = require("joi/lib/types/number");
const mongoose = require("mongoose");

const documentSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },

    description: { type: String, required: true },
    file: { type: String, required: true },
    parent: { type: mongoose.Schema.ObjectId, ref: "Document", default: null },

    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
