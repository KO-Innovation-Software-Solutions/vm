const PackageModel1 = require('./models/package1');
const axios = require('axios'); 

const ObdyModel = require('./models/obdsetting');
const Obdfunction = require('./models/odbfunctions');
const _ObdyFormulaModel = require("./models/obdformula");

const Alarm_packageModel = require('./models/alarmpackage');


const utilStatic = require('./utils_static');

// async function login(buff){

//    let listoffunction = await axios.get('http://192.168.4.41:3900/admin/checkfunction');
//    let package = await axios.get('http://192.168.4.41:3900/admin/obd/667be65b9b794f408de76ac2');

//    let selectpackage =  package.data.package.map(r=> {
//         const splitpackage = buff.slice(parseInt(r.command_name),parseInt(r.command_length));
//        if(r.command_type == splitpackage){
//         return r;
//        }
//     })
//     // console.log('selected package',selectpackage);
//    console.log(package.data)
//  return package.data;
// }



const typeofBuffer = async(_buffer) => {


  let buff = _buffer;
  let response = await ObdyModel.findById("667c3c402ad4b2ff7dfd93d3"); // from api this was static now need to pass dynamic afterwards

  buff_package = buff.slice(50,54); 
 


  if (buff_package == '4007'){

    console.log('if it comes here it 4007');

    //below variables are receiving the buffer values and structured according to the length for each parameters
    const deviceId = buff.slice(10,50);
    const stat_data = buff.slice(62,130);
    const buff_accOntime = stat_data.slice(0, 8);
    const buff_UTC_time = stat_data.slice(8, 16);
    const buff_mileage = stat_data.slice(16,24);
    const buff_cur_mil = stat_data.slice(24,32);
    const buff_fuel = stat_data.slice(32,40);
    const buff_current_fuel = stat_data.slice(40,44);
    const lat = buff.slice(144,152);
    const long = buff.slice(152,160);
    const buff_speed = buff.slice(160,164);
    

    
    console.log('buff value lat long', lat, long);

 

     //below variables are used to reverse the hexavalues and storing in according to the parameters
     const revLat = reverseString(lat);
     const revLong = reverseString(long);
     const revAccontime = reverseString(buff_accOntime);
     const utc_reverse_value = reverseString(buff_UTC_time);
     const mileage_reverse_value = reverseString(buff_mileage);
     const cur_mil_reverse_value = reverseString(buff_cur_mil);
     const fuel_reverse_value = reverseString(buff_fuel);
     const currentTripFuel_value = reverseString(buff_current_fuel);
     const speed_reverse_value = reverseString(buff_speed);

     // BELOW VARIABLES ARE CONVERTING REVERSED HEXADECIMAL TO DECIMAL
    const revlatTodec =  hexTodec(revLat);
    const revlognTodec = hexTodec(revLong);
    const accOntimeHextoDec = hexTodec(revAccontime);
    const utc_decimalvalue = hexTodec(utc_reverse_value);
    const mileageTOdecimal = hexTodec(mileage_reverse_value);
    const curMilTodecimal = hexTodec(cur_mil_reverse_value);
    const fuelTodecimal = hexTodec(fuel_reverse_value);
    const curentTripfuelTodecimal = hexTodec(currentTripFuel_value);
    const speedTodec = hexTodec(speed_reverse_value);


      //ASCII convertion to get DEVICE ID
      const DeviceIDAsci = hexToASCII(deviceId);

      
  
      // Calling function to calculate latitude and longtitude
      const latLong = calLatLong(revlatTodec, revlognTodec);
  
      console.log("lat long object"+ latLong.calLatLong);
      console.log(DeviceIDAsci);
  
      console.log(utc_decimalvalue);
  
      const timestampstoDateUTC = convertTimestampToDate(utc_decimalvalue);
      const timestamptoDateAcc = convertTimestampToDate(accOntimeHextoDec);
      const mileageFinal = mileageFunction(mileageTOdecimal);
      const curentMilfinal = mileageFunction(curMilTodecimal);
  
      const totalFuel = fuelCal(fuelTodecimal);
      const currentFuel = fuelCal(curentTripfuelTodecimal);
      const speed = speedCal(speedTodec);
        const bufff = "404059000430303030303836323730383034333037323737314001003f8cd566a98ed5665aaa2a004d110000675a00002700040804000341000000000000010209180a08291c2e50029458e21072055f08cf01cb0737dc0d0a";
        //  const bufff = "40406c000430303030303836323730383034333035373830364007ad000000d6608a66d9608a661f4d260070380000094f000072003400040003360000000000000107071809210d7c0951027543e21009003c088f0301060F000F00010400000000010500000000f5a50d0a"
      // const bufff = "40406c000430303030303836323730383034333035373830364007ad000000d6608a66d9608a661f4d260070380000094f000072003400040003360000000000000107071809210d7c0951027543e21009003c088f03010100000000010400000000010500000000f5a50d0a"
    //  const alarmVal = alarm(buff).join(', ');

    // const alarmVal =  alarm(buff).map(obj => `${obj.description}: ${obj.thresholdvalue}`).join(', ');
    const alarmVal = alarm(buff).map(obj => ({
      type: obj.description,
      threshold: obj.thresholdvalue
  }));
//  const alarmResult = alarm;

    // Construct the alarm object

// const alarmVal = alarm(buff).map(obj => `type: ${obj.description}: ${obj.thresholdvalue}`).join(', ');

  //   const alarmVal = {
  //     type: "OverSpeed",
  //     status: "Active",
  //     threshold: "100"
  // };


// const onlineStatus = alarmVal === 'Power on: 0, Power off: 0';
const onlineStatus = alarmVal.some(alarm => {alarm.description === 'Power on' && alarm.thresholdvalue === 0});



console.log('ldldldldld',alarmVal);

 
      
      await Alarm_packageModel.create({ 
        DeviceID : DeviceIDAsci, 
        onlineStatus: onlineStatus,
        Latitude : latLong?.lat, 
        Longtitude: latLong?.long,
        UTC:timestampstoDateUTC, 
        Accontime : timestamptoDateAcc,
        Total_Mileage: mileageFinal,
        Current_Trip_Mileage: curentMilfinal,
        Total_Fuel_Consumption:totalFuel,
        Current_Trip_Fuel: currentFuel,
        speed: speed,
        alarm: alarmVal,
        
        


        });
console.log('values what coming from',DeviceIDAsci,totalFuel, onlineStatus , latLong, timestamptoDateAcc, speed)
    let obj = {};

    

    // await Alarm_packageModel.create(obj);
    
  }
  // else if (buff_package == '4001') {

  // }
  else {

    if (!response || !response.package) {
      throw new Error("No response or package data found");
    }
    let selectpackage =  response.package.filter(r=> {
      // console.log('r package ', r);
        const splitpackage = buff.slice(parseInt(r.command_name),parseInt(r.command_length));
       if(r.command_type == splitpackage){
        
        return r;
       }
     
    });


    console.log('r package ', selectpackage);

    if (selectpackage.length === 0) {
      console.error('No matching package found');
      console.error('Response package:', response.package);
      console.error('Buffer package:', buff_package);
      throw new Error("No matching package found");
  }

  let selectedPackage = selectpackage[0];

  // console.log('selected Package will console here',selectedPackage );

  if (!selectedPackage?.package_splitter || selectedPackage.package_splitter.length === 0) {
    console.log('No package splitter found or package splitter is empty in the selected package');
    // console.log('Selected package:', selectedPackage);
    // Proceed with further logic or skip
    await PackageModel1.create({ message: "Package splitter is empty or not found" });
    return;
  }
  
    let obj = {};
    for await(const ps of selectpackage[0].package_splitter ){
  
            if(ps.setFormat){
                let splitter = buff.slice(parseInt(ps.start),parseInt(ps.end));
                let formulaID = ps.formatValues;
                // console.log(formulaID)
                let formulaname = await _ObdyFormulaModel.findOne({"formula._id" : formulaID}).lean();
                if (!formulaname) {
                  throw new Error(`No formula found for ID ${formulaID}`);
                 }
                let object = formulaname.formula.find(r=>(r._id).toString() == formulaID);
                if (!object) {
                  throw new Error(`No formula object found for ID ${formulaID}`);
                }
              
                let coordinates =  await Obdfunction.findOne({ name : object.parameter }).lean(); 
                if (!coordinates) {
                  throw new Error(`No coordinates found for parameter ${object.parameter}`);
              }
                // console.log(coordinates);
                  const fn = new Function('shortbuffer', coordinates.calculation);
                    const result = fn.apply(null, [splitter]);
                obj[ps.paramname] = result
               // console.log(coordinates) 
            }
    }
  
    // console.log('this is te object ',obj)
          await PackageModel1.create(obj);
      

    }
 
    }

    function alarm(buff) {
      // return  parseInt(shortbuffer.slice(170, 172), 10) > 0 ?  shortbuffer.slice(172, 172 + (parseInt(shortbuffer.slice(170, 172), 10) * 12))  : ''  ;
      // let package = "404066000430303030303836323730383034333037323737314007a200000016608a6619608a661f4d260066350000094f0000640010000400032d00000000000001070718091e01fc0251022c3ee210800185019f02000100000000010400000000516e0d0a";
    
     
      let alarmDescriptions = [];
      let alarmDescriptionObj = {};
      let alarmThresholdValues = [];
      let package = buff;
       let noOfAlarmsTriggered = parseInt(package.slice(170, 172), 10);
        if( noOfAlarmsTriggered > 0) {
    let alarmData = package.slice(172, 172 + (noOfAlarmsTriggered * 12));
     const alarmTypes = { 
              "01": "Overspeed",
              "02": "Low voltage",
              "03": "High Engine Coolant Temperature",
              "04": "Hard Acceleration",
              "05": "Hard Deacceleration",
              "06": "Idle engine",
              "07": "Towing",
              "08": "High RPM",
              "09": "Power on",
              "0a": "Exhaust Emission",
              "0b": "Quick Lane change",
              "0c": "Sharp turn",
              "0d": "Fatigue driving",
              "0e": "Power off",
              "0f": "Geo-fence",
              "10": "Emergency",
              "11": "Crash",
              "12": "Tamper",
              "13": "Illegal enter",
              "14": "Illegal ignition",
              "15": "OBD communication error",
              "16": "Ignition on",
              "17": "Ignition off",
              "18": "MIL alarm",
              "19": "Unlock alarm",
              "1a": "No card presented",
              "1b": "Dangerous driving",
              "1c": "Vibration",
          }
         for (i=0; i < noOfAlarmsTriggered; i++) {
             
      let alarmsegment = alarmData.slice(i * 12, (i+1) * 12  );
            //  console.log(alarmsegment, typeof(alarmsegment));
            //  console.log("Alarm Segment:", alarmsegment, typeof(alarmsegment));
             let alarmTypeCode = alarmsegment.slice(2, 4);
            //  console.log("Alarm Type Code:", alarmTypeCode);

            let alarmThresholdSetvalue = alarmsegment.slice(4, 8 );
            let alarmThresholdActualValue = alarmsegment.slice(8, 12);


              // Verify the exact code being extracted
            // console.log(`Extracted alarmTypeCode: ${alarmTypeCode}`);
              // Check if alarmTypeCode exists in alarmTypes

              
             
            let alarmDescription = alarmTypes[alarmTypeCode];
            let alarmThresholdValue = hexTodec(reverseString(alarmsegment.slice(8, 12)));

            if (alarmDescription) {
                console.log(`Found alarm description: ${alarmDescription}`);
                console.log(`Alarm Threshold set value ${alarmThresholdSetvalue}`);
                console.log(`Alarm Threshold Current value ${alarmThresholdActualValue}`);
            } else {
                console.log(`Alarm description not found for code: ${alarmTypeCode}`);
                alarmDescription = "Unknown Alarm";
            }

              let alarmDescriptionObj = {
              description : alarmDescription,
              thresholdvalue : alarmThresholdValue
             }
            //  alarmDescriptions.push(alarmDescription, alarmThresholdValue);
            alarmDescriptions.push(alarmDescriptionObj);
             alarmThresholdValues.push(alarmThresholdValue);
             
         }
         
        }

        console.log('alarm description object comes herer',alarmDescriptions);
        // console.log('ggggggg', buff)
        // console.log('gfgggggggg', alarmDescriptions)
        return alarmDescriptions;
    }
    console.log('oooooooooo',alarm);

function hexTodec (hexValue) {
      // console.log('what is value getting here', hexValue);
      let decValue = parseInt(hexValue, 16);// convert the hexavalue to Decimal
      
      let text = decValue.toString(); // convert the decimal value to string
      // console.log('lat to decimal value', text);
      return text;

  }

function decimalToHex(decimal) {
    return decimal.toString(16).toUpperCase();
}

function reverseString (getRevseValue){
  let splittedArray = getRevseValue.split(/(..)/g); // convert the string to array by using split method using regex we can split by 2 characters
  splittedArray.reverse();
  let reversedString = splittedArray.join("");
  // console.log('reversed lat value', reversedString);
  return reversedString;
}

function convertTimestampToDate(timestamp) {

  // Convert timestamp to milliseconds
  const timestampInMillis = timestamp * 1000;


  // Create a new Date object using the timestamp in milliseconds
  const date = new Date(timestampInMillis);


  // Convert the date to Indian Standard Time (IST)
  const ISTDate = date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  


  return ISTDate;
}


function mileageFunction(milege){

return milege / 1000;

}


function fuelCal(fuel){
  return fuel * 0.01
}

function speedCal(speed){
  return speed * 0.036;
}
function calLatLong(lat, long){

  let lattitude = lat/3600000;
  let longtitude = long/3600000;
  console.log(lattitude, longtitude);
  return {lat:lattitude, long: longtitude};

}
  
function reverseString (getRevseValue){
  let splittedArray = getRevseValue.split(/(..)/g); // convert the string to array by using split method using regex we can split by 2 characters
  splittedArray.reverse();
  let reversedString = splittedArray.join("");
  // console.log('reversed lat value', reversedString);
  return reversedString;
}

function hexToASCII(hex) {
  // initialize the ASCII code string as empty.
  var ascii = "";

  for (var i = 0; i < hex.length; i += 2) {
    // extract two characters from hex string
    var part = hex.substring(i, i + 2);

    // change it into base 16 and
    // typecast as the character
    var ch = String.fromCharCode(parseInt(part, 16));

    // add this char to final ASCII string
    ascii = ascii + ch;
  }
  return ascii;
}





module.exports = {
    typeofBuffer,
    hexTodec,
    reverseString,
    decimalToHex
}