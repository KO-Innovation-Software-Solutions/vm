const mongoose = require('mongoose');

// Define the structure of the 'alarm' field as an object
const alarmSchema = new mongoose.Schema({
    type: String,
    status: String,
    threshold: String,
    // Add more fields as needed
});

const alarmPack = new mongoose.Schema({
    createdAt: { type: Date, default: Date.now },
    DeviceID : String,
    UTC: String,
    Accontime:String,
    online: Boolean,
    Total_Mileage: String,
    Current_Trip_Mileage: String,
    Latitude : String,
    Longtitude: String,
    Total_Fuel_Consumption: String,
    Current_Trip_Fuel: String,
    speed: String,
    packname : String,
    onlineStatus : Boolean,
    alarm: {
        type: [alarmSchema],  // Use the alarmSchema as the structure for the alarm field
        default: [],   // Optional: provide a default empty array
    }
}

,{ timestamps : true })

const Alarm_packageModel = mongoose.model('alarmpackages', alarmPack);
module.exports = Alarm_packageModel;