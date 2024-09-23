const mongoose = require('mongoose');


const packaheModel = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    DeviceID : String,
    Accontime:String,
    UTC: String,
    online: Boolean,
    Total_Mileage: String,
    Current_Trip_Mileage: String,
    Latitude : Number,
    Longtitude: Number,
    Total_Fuel_Consumption: String,
    Current_Trip_Fuel: String,
    Speed: String,
    onlineStatus: Boolean,

   //coordinates : { lat : String , long : String },
    // Ontime: String,

},{ timestamps : true });

// Define the virtual field to populate alarm details
packaheModel.virtual('alarmDetails', {
    ref: 'alarmpackages',
    localField: 'DeviceID',
    foreignField: 'DeviceID',
    justOne: false, // Set to true if you expect only one alarm per device
});

// Ensure virtual fields are included in JSON and Object outputs
packaheModel.set('toObject', { virtuals: true });
packaheModel.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Package1', packaheModel);
