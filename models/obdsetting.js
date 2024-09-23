const mongoose = require("mongoose");
const { Schema } = mongoose;

const ObdyModel = new Schema(
  {
     devicemanufacturing : String,
     model : String,
     short_name : String,
     package : [
        {
            command_type : String,
            command_name : String,
            command_length : String,
            package_splitter : [
                {
                    paramname : String,
                    start : String,
                    end : String,
                    setFormat : { type : Boolean , default : false },
                    formatValues : { type : Schema.Types.ObjectId , ref : "Obdformula" }
                }
            ]
            
        }
     ]
  },
  { timestamps: true }
);

const _ObdyModel = mongoose.model("Obdsetting", ObdyModel);
module.exports = _ObdyModel;
