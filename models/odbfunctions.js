const mongoose = require("mongoose");
const { Schema } = mongoose;

const ObdyModel = new Schema(
  {
    name : String,
    calculation : mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const _ObdyModel = mongoose.model("Obdfunction", ObdyModel);
module.exports = _ObdyModel;
