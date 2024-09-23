const mongoose = require("mongoose");
const { Schema } = mongoose;

const ObdyFormulaModel = new Schema(
  {
    formula: [
        {
           
          parameter: String,
          calibrationFormula: String,
        }
      ],
      
  },
  { timestamps: true }
);

const _ObdyFormulaModel = mongoose.model("Obdformula", ObdyFormulaModel);
module.exports = _ObdyFormulaModel;