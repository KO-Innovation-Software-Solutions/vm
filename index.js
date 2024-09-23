
const port = 8021;
const utils = require('./utils');
const net = require('net');
// const commandutile = require('./command');
// const fs = require('fs');
// const filePath = 'data.txt';
const cors = require('cors'); // Import the cors package
const axios = require('axios'); 
const express = require('express');
const router = express.Router();
const crc = require('./checksum');


const app = express();


const ObdController = require("./controllers/obd/ObdController");
const ObdFromulaController = require("./controllers/obd/ObdFormula");

const PackageModel1 = require('./models/package1');

const AlarmModel = require('./models/alarmpackage');


// Enable CORS for the specific origin
app.use(cors({
    origin: '*' // Allow requests from this origin
}));

// Middleware to parse JSON
app.use(express.json());

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Connect to MongoDB
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/obd_data', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define a route
app.get('/', async(req, res) => {

    let obdData = await PackageModel1.find().sort({createdAt:-1}).lean();

    res.render('showpackage1', { obdData });
//  return  res.status(200).send(obdData);
});

app.get('/alarm', async(req, res) => {
    let alarmData = await AlarmModel.find().sort({createdAt:-1}).lean();

    res.render('alarmpackage.ejs', { alarmData });

});


// axios.get('http://192.168.4.41:3900/admin/checkfunction')
//     .then(response => {
//         console.log('localhsot response ',response.data);
//     })
//     .catch(error => {
//         console.error('Error making GET request:', error);
//     });

 
// Define API Routes 
app.get('/api/obdSumDatas', async (req, res) => {

    const { deviceId, startDate, endDate } = req.query;

    // console.log('start Date' , startDate, )
    if (!deviceId || !startDate || !endDate) {
        return res.status(400).json({ error: 'deviceId, startDate, and endDate are required.' });
    }

    try {

         // Convert startDate and endDate to ISO strings
        //  const startISODate = new Date(startDate).toISOString();
        //  const endISODate = new Date(endDate).toISOString();
        const results = await AlarmModel.aggregate([
            {
                $match: {
                    DeviceID: deviceId,
                    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
                }
            },

            {
                $addFields: {
                    fuel: { $toDouble: "$Current_Trip_Fuel" },
                    currentTripMile: { $toDouble: "$Current_Trip_Mileage" },

                }
            },
            {
                $group: {
                    _id: null,
                    Current_Trip_Fuel: { $sum: "$fuel" },
                    Current_Trip_Mileage: {$sum:"$currentTripMile" },
                }
            },
            // {
            //     $group: {
            //         _id: null,
            //         Current_Trip_Mileage: { $sum: { $toDouble: "$Current_Trip_Mileage" } },
            //         Current_Trip_Fuel: { $sum: { $toDouble: "$Current_Trip_Fuel" } },
            //         // Add more fields here if needed
            //     }
            // }
        ]);

        res.status(200).json(results);

    
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

app.get('/api/obdData', async (req, res) => {
    try {
        // let obdData = await PackageModel1.find().sort({ createdAt: -1 });
        let currentdatetime = new Date().toISOString();

        let obdData = await PackageModel1.aggregate([
            {$sort:{ createdAt : -1 }},
            { $limit: 5 },
            {  $group : { _id : "$DeviceID" , "fields" : { "$first" : "$$ROOT" }  }},
            {  "$replaceRoot" : { "newRoot" : "$fields"  }    },
            {
                $addFields : {
                    onlinestatusbasedonSecondgreaterthan30 : {
                        $cond : {
                            if : { $gte : [
                                {
                                    $divide : [
                                        {  $subtract :  [ "$$NOW" , "$createdAt" ] } ,
                                        1000 
                                      ]
                                },
                                300
                            ] },
                            then : false,
                            else : true
                        }
                    },
                    
                }
            }
            // {
            //     $addFields : {
            //         onlinestatus : {
            //             $divide : [
            //               {  $subtract :  [ "$$NOW" , "$createdAt" ] } ,
            //               1000
            //             ]
            //         }
            //     }
            // }
        ]);

        // let obdData = await PackageModel1.aggregate([
        //     { $sort: { createdAt: -1 } },
        //     { $group: { _id: "$deviceId", fields: { $push: "$$ROOT" } } },
        //     {
        //         $project: {
        //             fields: { $slice: ["$fields", 10] }
        //         }
        //     },
        //     { "$unwind": "$fields" },
        //     { "$replaceRoot": { "newRoot": "$fields" } }
        // ]);
            
        res.status(200).json(obdData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/obdDatabylistofdevices', async (req, res) => {
    try {

         // Assuming you pass the list of DeviceIDs as a comma-separated string in the query parameter 'deviceIds'
         const deviceIds = req.query.deviceIds ? req.query.deviceIds.split(',') : [];

         // Check if deviceIds array is empty
        if (deviceIds.length === 0) {
            return res.status(400).json({ message: 'No DeviceIDs provided' });
        }
        const THRESHOLD_SECONDS = 300; // Threshold to determine if the device is online


        let obdData = await PackageModel1.aggregate([
            // Match only the documents with DeviceIDs that are in the deviceIds array
            { $match: { DeviceID: { $in: deviceIds } } },
            {$sort:{ createdAt : -1 }},
            { $limit: 5 },
            {  $group : { _id : "$DeviceID" , "fields" : { "$first" : "$$ROOT" }  }},
            {  "$replaceRoot" : { "newRoot" : "$fields"  }    },
            {
                $addFields: {
                    onlineStatus: {
                        $cond: {
                            if: {
                                $lte: [
                                    { $divide: [{ $subtract: ["$$NOW", "$createdAt"] }, 1000] }, // Calculate time difference in seconds
                                    THRESHOLD_SECONDS
                                ]
                            },
                            then: true, // Device is online if the difference is less than or equal to 60 seconds
                            else: false // Device is offline if the difference is more than 60 seconds
                        }
                    }
                }
            },

            // Lookup to populate alarmDetails, limiting to 3 most recent
            {
                $lookup: {
                    from: 'alarmpackages', // The name of the alarm data collection
                    localField: 'DeviceID',
                    foreignField: 'DeviceID',
                    as: 'alarmDetails',
                    pipeline: [
                        { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
                        { $limit: 1 }, // Limit to the most recent 3 documents
                    ]
                }
            },

            // Add a field to check the latest Ignition status (on or off) from alarmDetails
            {
                $addFields: {
                    ignitionStatus: {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: [{ $size: "$alarmDetails" }, 0] },  // Check if alarmDetails is not empty
                                    {
                                        $eq: [
                                            { $arrayElemAt: ["$alarmDetails.alarm", 0] },  // Get the most recent alarm
                                            "Ignition on"
                                        ]
                                    }
                                ]
                            },
                            then: "Ignition On",
                            else: "Ignition Off"
                        }
                    }
                }
            }
            
           
        ]);

        // Populate the virtual field 'alarmDetails' after aggregation
        // obdData = await PackageModel1.populate(obdData, {
        //     path: 'alarmDetails',
        //     model: 'alarmpackages' // Reference to the AlarmModel
        // });


        
            
        res.status(200).json(obdData);

        // console.log('list of OBDS with Alarm Details', obdData)
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
        console.log(error);
    }
})




app.get('/crc',(req,res)=>{
    
    let { crcq } = req.query
    console.log(crcq)
const gg = crc.crc16itu(crcq);
console.log('harii');
console.log(gg);
console.log('hariiii---fdjdsfjshf');
return res.status(200).json({
    ll : gg
});
})


// Api for getting details using imei Number or Device Id
app.get('/api/obdDatadeviceid', async(req, res) => {

    try {

        // extract device id from URL query parameters
        const {deviceId} = req.query; 
        // query for getting device details by  device id
        let obdData = await PackageModel1.find({"DeviceID": deviceId})
        .sort({ _id: -1 })  // Sort by ID in descending order (newest first)
        .limit(1);          // Limit the results to 1

        return res.status(200).json(obdData);

    }
    catch (error) {
        console.error('Error fetching data by Device ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});


app.post('/obd',ObdController.insert);
app.patch('/obd/:id',ObdController.update);
app.get('/obd',ObdController.list);
app.delete('/obd/:id',ObdController._delete);
app.get('/obd/:id',ObdController.get);
app.patch('/obd/:_id/:packageid', ObdController.updatePackageSplitter);
app.get('/obd/:_id/:packageid', ObdController.getPackageSplitter);
app.delete('/obd/:_id/:packageid/:packageSplitterId', ObdController.deletePackageSplitter);

app.post('/obdformula',ObdFromulaController.insert );
app.get('/obdformula',ObdFromulaController.list );
app.get('/obdformula/:_id', ObdFromulaController.getFormulaByID);

app.get('/storefunction', ObdController.storefunctions);
app.get('/checkfunction', ObdController.checkfunction);


// Define the  route with dates
app.get('/api/obdDataDate', async (req, res) => {
    try {

       // Extract startDate and endDate from query parameters
        const { startDate, endDate, deviceId } = req.query;

            // Convert query parameters to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);

              // Validate the date objects
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        console.log('consoling dates sssss',start, end, deviceId);
            // Ensure end date is after start date
         if (end < start) {
                return res.status(400).json({ error: 'endDate must be after startDate' });
            }

        // query for getting device details by date and time and device id
            let obdData = await PackageModel1.find({"createdAt":{"$gte":start,
            "$lte":end}, "DeviceID": deviceId});
 
        // Validate query parameters
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Missing startDate or endDate query parameter' });
        }


        
        // Log the aggregation result and send the response
        console.log('Aggregation result:', obdData);
        // console.log('date format data',data);
        return res.status(200).json(obdData);

   

        
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//api route for getting alarm only with deviceId

app.get('/api/alarmBydevice', async(req, res) => {
    try {

        const deviceId = req.query.id;

        let response =  await AlarmModel.aggregate([
            {
                $match: {
                   
                    "DeviceID": deviceId
                }
            },
            {
                $project: {
                    alarms: { $split: ["$alarm", ", "] }
                }
            },
            {
                $unwind: "$alarms"
            },
            {
                $group: {
                    _id: "$alarms",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    alarm: "$_id",
                    count: 1
                }
            }
        ]);

          // Log the aggregation result and send the response
          console.log('Alarm Data By Device ID', response);
          return res.status(200).json(response);
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
        console.log(error);
    }
})

// API for Getting Driving Behaviour based on deviceid array registered for particular vendor showing in their dashboard
app.get('/api/alarmbyvendor', async(req, res) => {
    try {
        const { startDate, endDate, deviceIds } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Parse deviceIds as an array if it's passed as a comma-separated string
        const deviceIdArray = deviceIds.split(',');

        const alarm_data = await AlarmModel.aggregate([
            {
                $match: {
                    createdAt: { "$gte": start, "$lte": end },
                    DeviceID: { $in: deviceIdArray }
                }
            },
            {
                $unwind: "$alarm" // Unwind the array to handle each alarm object
            },
            {
                $group: {
                    _id: "$alarm.type", // Group by the alarm type
                    count: { $sum: 1 },
                    totalThresholdValue: { $sum: { $toInt: "$alarm.threshold" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    alarm: "$_id",
                    count: 1,
                    totalThresholdValue: 1
                }
            }
        ]);

        // console.log('Aggregation result: for Alarm by Vendors list', alarm_data);
        return res.status(200).json(alarm_data);


    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
        console.log(error);
    }
});

// API route for getting alarm with device id and date time

app.get('/api/alarmData', async (req, res) => {
    try {
        const {  startDate, endDate, deviceId} = req.query;
        // Convert query parameters to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // let alarm_data = await AlarmModel.find({"createdAt":{"$gte":start,
        //     "$lte":end}, "DeviceID": deviceId});

        //        // Log the aggregation result and send the response
        // console.log('Aggregation result: for Alarm', alarm_data);
        // return res.status(200).json(alarm_data);

        // const alarm_data = await AlarmModel.aggregate([
        //     {
        //         $match: {
        //             "createdAt": { "$gte": start, "$lte": end },
        //             "DeviceID": deviceId
        //         }
        //     },
        //     {
        //         $unwind: "$alarm" // Split the alarm string into an array of alarms
        //     },
        //     {
        //         $group: {
        //             _id: "$alarm",
        //             count: { $sum: 1 }
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             alarm: "$_id",
        //             count: 1
        //         }
        //     }
        // ]);

        // const alarm_data = await AlarmModel.aggregate([
        //     {
        //         $match: {
        //             "createdAt": { "$gte": start, "$lte": end },
        //             "DeviceID": deviceId
        //         }
        //     },
        //     {
        //         $project: {
        //             alarms: { $split: ["$alarm", ", "] }
        //         }
        //     },
        //     {
        //         $unwind: "$alarms"
        //     },
        //     {
        //         $group: {
        //             _id: "$alarms",
        //             count: { $sum: 1 }
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             alarm: "$_id",
        //             count: 1
        //         }
        //     }
        // ]);

        //   // Log the aggregation result and send the response
        //   console.log('Aggregation result: for Alarm', alarm_data);
        //   return res.status(200).json(alarm_data);
        const alarm_data = await AlarmModel.aggregate([
            {
                $match: {
                    "createdAt": { "$gte": start, "$lte": end },
                    "DeviceID": deviceId
                }
            },
            {
                $unwind: "$alarm" // Unwind the array to handle each alarm object
            },
            {
                $group: {
                    _id: "$alarm.type", // Group by the alarm type
                    count: { $sum: 1 },
                    totalThresholdValue: { $sum: { $toInt: "$alarm.threshold" } }
                }
            },
            {
                $project: {
                    _id: 0,
                    alarm: "$_id",
                    count: 1,
                    totalThresholdValue: 1
                }
            },
            {
                $sort: { alarm: -1 } // Sort by alarm type (ascending). Use -1 for descending.
            }
        ]);

        // Log the aggregation result and send the response
        // console.log('Aggregation result: for Alarm', alarm_data);
        return res.status(200).json(alarm_data);
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
        console.log(error);
    }
})


// api for getting joined data of alarmpackages collection in to obddata (package1)
app.get('/api/alarmtrigger', async (req, res) => {
    try {

         // Assuming you pass the list of DeviceIDs as a comma-separated string in the query parameter 'deviceIds'
         const deviceIds = req.query.deviceIds ? req.query.deviceIds.split(',') : [];

         // Check if deviceIds array is empty
        if (deviceIds.length === 0) {
            return res.status(400).json({ message: 'No DeviceIDs provided' });
        }
        const THRESHOLD_SECONDS = 40; // Threshold to determine if the device is online


        let alarmTriggerData = await AlarmModel.aggregate([
            {
                $match: {
                    DeviceID: { $in: deviceIds } // Match only the specified DeviceIDs
                }
            },

            {
                $addFields: {
                    onlinestatusbasedonSecondgreaterthan30: {
                        $cond: {
                            if: {
                                $gte: [
                                    { $divide: [{ $subtract: ["$$NOW", "$createdAt"] }, 1000] },
                                    THRESHOLD_SECONDS
                                ]
                            },
                            then: false,
                            else: true
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$DeviceID", "fields": { "$first": "$$ROOT" } } },
            { "$replaceRoot": { "newRoot": "$fields" } },
            {
                $addFields: {
                    onlinestatusbasedonSecondgreaterthan30: {
                        $cond: {
                            if: {
                                $gte: [
                                    { $divide: [{ $subtract: ["$$NOW", "$createdAt"] }, 1000] },
                                    THRESHOLD_SECONDS
                                ]
                            },
                            then: false,
                            else: true
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'alarmpackages', // The name of the alarmData collection
                    let: { deviceId: "$DeviceID" }, // Pass the DeviceID to the lookup pipeline
                    pipeline: [
                        { $match: { $expr: { $eq: ["$DeviceID", "$$deviceId"] } } }, // Match by DeviceID
                        { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
                        { $limit: 1 }, // Limit to the most recent 5 documents
                        {
                            $project: {
                                alarms: { $split: ["$alarm", ", "] },
                                createdAt: 1,
                                otherFields: {
                                    DeviceID: 1,
                                    // include any other fields you need
                                }
                            }
                        },
                        { $unwind: "$alarms" }, // Unwind the alarms array to create individual documents
                        {
                            $group: {
                                _id: "$alarms",
                                count: { $sum: 1 },
                                details: { $push: "$$ROOT" } // Collect all details into an array
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                alarm: "$_id",
                                count: 1,
                                details: 1
                            }
                        }
                    ],
                    as: 'alarmDetails' // Output array field
                }
            },
            {
                $project: {
                    _id: 1,
                    DeviceID: 1,
                    createdAt: 1,
                    alarmDetails: 1, // Include alarm details
                    // Other fields from obdData collection
                    onlinestatusbasedonSecondgreaterthan30: 1,
                    Latitude: 1,
                    Longtitude: 1,
                    Accontime: 1,
                    Current_Trip_Fuel: 1,
                    Current_Trip_Mileage: 1,
                    Speed: 1,
                    Total_Fuel_Consumption: 1,
                    Total_Mileage: 1,
                    UTC: 1,
                    onlineStatus: {
                        $cond: {
                            if: {
                                $lte: [
                                    { $divide: [{ $subtract: ["$$NOW", "$createdAt"] }, 1000] },
                                    THRESHOLD_SECONDS
                                ]
                            },
                            then: "$onlineStatus",
                            else: false
                        }
                    }
                    // Add any other fields you need from the PackageModel1 documents
                }
            }
        ]);

         // Log the aggregation result and send the response
         console.log('Alarm Package Triggered by combine:', alarmTriggerData);
         return res.status(200).json(alarmTriggerData);
 
        
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
        console.log(error);
    }
})

// app.post('/api/obdData', async (req, res) => {
//     try {
//         const newObdData = new PackageModel1(req.body);
//         const savedObdData = await newObdData.save();
//         res.status(201).json(savedObdData);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// app.put('/api/obdData/:id', async (req, res) => {
//     try {
//         const updatedObdData = await PackageModel1.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
//         if (!updatedObdData) return res.status(404).json({ error: 'OBD data not found' });
//         res.status(200).json(updatedObdData);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// app.delete('/api/obdData/:id', async (req, res) => {
//     try {
//         const deletedObdData = await PackageModel1.findByIdAndDelete(req.params.id);
//         if (!deletedObdData) return res.status(404).json({ error: 'OBD data not found' });
//         res.status(200).json({ message: 'OBD data deleted' });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });


// Define the IP address and port to listen on
const IP_ADDRESS = '115.245.218.52'; 
const PORT = 8021;


// Function to decode GPS data
function decodeGPSData(data) {
    // Assuming GPS data format and decoding logic according to your provided format
    // Here, we just convert the received buffer to a string for demonstration
    return data.toString('hex'); // Adjust the decoding logic as per your actual data format
}



const server = net.createServer((socket) => {
    console.log('Client connected!');

   

   const command = '0x1002'; // PID for latitude
    // const long = '' 
    // socket.write("0xF1 0x00");
    // socket.write('0x2802');
   
    // Handle data received from the client
    socket.on('data', (data) => { 
        const decodedData = decodeGPSData(data);
        const loginPackage = decodedData.slice(50,54); // Convert buffer to string
        console.log('Package Command Will come here',loginPackage)
        console.log('Received GPS data:', decodedData); 
        // const buffer = Buffer.from('9001', 'hex');3030303030383632373038303433303537393231
        //  const responseBuffer = Buffer.from('404029000330303030303836343530373033383632373936339001FFFFFFFF000014277D66952B0D0A', 'hex');
        //  const responseBuffer = Buffer.from('404029000430303030303836323730383034333037323737319001FFFFFFFF000014277D66952B0D0A', 'hex');  // Device id 00000862708043072771
        //   const responseBuffer = Buffer.from('404029000430303030303836323730383034333035373932319001FFFFFFFF000014277D66952B0D0A', 'hex');  // Device id 00000862708043057921

          const responseBuffer = Buffer.from('404029000430303030303836323730383034333035373830369001FFFFFFFF000014277D6695CA0D0A', 'hex');  // Device id 00000862708043057806

          

        if(loginPackage == 1001){
            let changeAppendrc = `${decodedData.slice(0,4)}2900${decodedData.slice(8,10)}${decodedData.slice(10,50)}9001FFFFFFFF0000${decodedData.slice(62,70)}`
            // console.log(changeAppendrc)
            const gg = crc.crc16itu(changeAppendrc);
            console.log('Package 1001 values', decodedData.slice(8,10), decodedData.slice(10,50),   decodedData.slice(62,70))
            // console.log('crc v',gg)
            let crcTOdec = utils.decimalToHex(gg);
            let crcchecksum = utils.reverseString( utils.decimalToHex(gg));

        //    console.log('crc decimal to hex',crcTOdec);
        //    console.log('crc hexto reverse',crcchecksum);
            // changeAppendrc = `${changeAppendrc}61A8${decodedData.slice(-4)}`
            changeAppendrc = `${changeAppendrc}${crcchecksum}${decodedData.slice(-4)}`
            // console.log('jjjjj')
            // console.log(crcchecksum);
            // console.log(changeAppendrc);
            // console.log('jjjjj')

             // Convert changeAppendrc to a Buffer
            const responseNewBuffer = Buffer.from(changeAppendrc, 'hex');
            socket.write( responseNewBuffer, (err) => {
                if (err) {
                  console.error(err);
                } else {
                    console.log('reply package',changeAppendrc);
                  console.log('login Reply sent successfully!');
                }
              });
              utils.typeofBuffer(decodedData);
        }
        else if (loginPackage == 4007){
            let changeAppendrc = `${decodedData.slice(0,4)}2300${decodedData.slice(8,10)}${decodedData.slice(10,50)}C007${decodedData.slice(54,62)}`
            const gg = crc.crc16itu(changeAppendrc);
            let crcTOdec = utils.decimalToHex(gg);
            let crcchecksum = utils.reverseString( utils.decimalToHex(gg));
            changeAppendrc = `${changeAppendrc}${crcchecksum}${decodedData.slice(-4)}`;
            const responseNewBuffer = Buffer.from(changeAppendrc, 'hex');

            socket.write( responseNewBuffer, (err) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log('Alarm Packaage Reply sent successfully!');
                }
              });
              utils.typeofBuffer(decodedData);
        }
        else if (loginPackage == 1003) {
            let changeAppendrc = `${decodedData.slice(0,4)}1F00${decodedData.slice(8,10)}${decodedData.slice(10,50)}9003`
            const gg = crc.crc16itu(changeAppendrc);
            // console.log('slice daa', decodedData.slice(8,10), decodedData.slice(10,50),   decodedData.slice(62,70))
            // console.log('crc v',gg)
            let crcTOdec = utils.decimalToHex(gg);
            let crcchecksum = utils.reverseString( utils.decimalToHex(gg));
        changeAppendrc = `${changeAppendrc}${crcchecksum}${decodedData.slice(-4)}`;
        const responseNewBuffer = Buffer.from(changeAppendrc, 'hex');

            socket.write( responseNewBuffer, (err) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log('Heart bet Reply sent successfully!');
                }
              });
        }
        else if (loginPackage == 4001) {

        
        utils.typeofBuffer(decodedData);

        console.log('GPS Package Is Uploading to Server',decodedData );

        }
       

       

    });
 
    socket.on('error', (err) => {
        console.error(`Socket error: ${err}`);
    });

    // const command = 'AT+STATUS\r\n';
   // socket.write(command);

    // Handle client disconnection
    socket.on('end', () => {
        console.log('Client disconnected!');
    });
});


//OBD





server.listen(port, '0.0.0.0', () => {
    console.log(`TCp at http://0.0.0.0:${port}`);
});

// Start the server
app.listen('3900', '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
  
  // Handle errors
  app.on('error', (err) => {
    console.error('Server error:', err.message);
  });