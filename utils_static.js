const PackageModel1 = require('./models/package1');

function hexTodec (hexValue) {

    // console.log('what is value getting here', hexValue);
    let decValue = parseInt(hexValue, 16);// convert the hexavalue to Decimal
    
    let text = decValue.toString(); // convert the decimal value to string
    // console.log('lat to decimal value', text);

    return text;

}




function reverseString (getRevseValue){
    let splittedArray = getRevseValue.split(/(..)/g); // convert the string to array by using split method using regex we can split by 2 characters
    splittedArray.reverse();
    let reversedString = splittedArray.join("");
    // console.log('reversed lat value', reversedString);
    return reversedString;
}

function calLatLong(lat, long){

    let lattitude = lat/3600000;
    let longtitude = long/3600000;
    console.log(lattitude, longtitude);
    return {lat:lattitude, long: longtitude};

}
// program to convert hexadecimal
      // string to ASCII format string
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

  function convertTimestampToDate(timestamp) {

    // Convert timestamp to milliseconds
    const timestampInMillis = timestamp * 1000;


    // Create a new Date object using the timestamp in milliseconds
    const date = new Date(timestampInMillis);


    // Convert the date to Indian Standard Time (IST)
    const ISTDate = date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    
    // Format the date
    // const year = date.getUTCFullYear();
    // const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    // const day = ('0' + date.getUTCDate()).slice(-2);
    // const hours = ('0' + date.getUTCHours()).slice(-2);
    // const minutes = ('0' + date.getUTCMinutes()).slice(-2);
    // const seconds = ('0' + date.getUTCSeconds()).slice(-2);

    // Return formatted date
    // return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return ISTDate;
}


function mileageFunction(milege){

return milege / 1000;

}


function fuelCal(fuel){
    return fuel * 0.01
}

function speedCal(speed){
    return speed / 60;
}
async function login(buff){

    //below variables are receiving the buffer values and structured according to the length for each parameters
    const header = buff.slice(0,4);
    const packagelength = buff.slice(4,8 );
    const sofVersion = buff.slice(8,10);
    const deviceId = buff.slice(10,50) ;
    const cmdtype = buff.slice(50,54);

    const stat_data = buff.slice(54,122);
    const buff_accOntime = stat_data.slice(0, 8);
    const buff_UTC_time = stat_data.slice(8, 16);
    const buff_mileage = stat_data.slice(16,24);
    const buff_cur_mil = stat_data.slice(24,32);
    const buff_fuel = stat_data.slice(32,40);
    const lat = buff.slice(136,144);
    const long = buff.slice(144,152);
    const buff_speed = buff.slice(152,156);

console.log('acc on time buff value',buff_accOntime)

    //below variables are used to reverse the hexavalues and storing in according to the parameters
    const revLat = reverseString(lat);
    const revLong = reverseString(long);
    const revAccontime = reverseString(buff_accOntime);
    const utc_reverse_value = reverseString(buff_UTC_time);
    const mileage_reverse_value = reverseString(buff_mileage);
    const cur_mil_reverse_value = reverseString(buff_cur_mil);
    const fuel_reverse_value = reverseString(buff_fuel);
    const speed_reverse_value = reverseString(buff_speed);
    

   
 

// BELOW VARIABLES ARE CONVERTING REVERSED HEXADECIMAL TO DECIMAL
    const revlatTodec =  hexTodec(revLat);
    const revlognTodec = hexTodec(revLong);
    const accOntimeHextoDec = hexTodec(revAccontime);
    const utc_decimalvalue = hexTodec(utc_reverse_value);
    const mileageTOdecimal = hexTodec(mileage_reverse_value);
    const curMilTodecimal = hexTodec(cur_mil_reverse_value);
    const fuelTodecimal = hexTodec(fuel_reverse_value);
    const speedTodec = hexTodec(speed_reverse_value);


    //ASCII convertion to get DEVICE ID
    const DeviceIDAsci = hexToASCII(deviceId);

    const onlineStatus = true;

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
    const speed = speedCal(speedTodec);

    console.log('time stamp of UTC', timestampstoDateUTC);

    console.log(timestampstoDateUTC);
    console.log(timestamptoDateAcc );
    console.log(mileageFinal );
    console.log(totalFuel );
    console.log(speed );

    await PackageModel1.create({ 
        deviceId : DeviceIDAsci , 
        online : onlineStatus,
        coordinates : latLong, 
        utcTime:timestampstoDateUTC, 
         Ontime : timestamptoDateAcc,
         mileage: mileageFinal,
         currenttrip: curentMilfinal,
         FuelConsumption:totalFuel,
         speed: speed,

        });
    
    
}

async function Offli(buff){

    const deviceId = buff.slice(10,50) ;
    const cmdtype = buff.slice(50,54);

    const stat_data = buff.slice(54,122);
    const buff_accOntime = stat_data.slice(0, 8);
    const buff_UTC_time = stat_data.slice(8, 16);
    const buff_mileage = stat_data.slice(16,24);
    const buff_cur_mil = stat_data.slice(24,32);
    const buff_fuel = stat_data.slice(32,40);
    const lat = buff.slice(136,144);
    const long = buff.slice(144,152);
    const buff_speed = buff.slice(152,156);

    //below variables are used to reverse the hexavalues and storing in according to the parameters
    const revLat = reverseString(lat);
    const revLong = reverseString(long);
    const revAccontime = reverseString(buff_accOntime);
    const utc_reverse_value = reverseString(buff_UTC_time);
    const mileage_reverse_value = reverseString(buff_mileage);
    const cur_mil_reverse_value = reverseString(buff_cur_mil);
    const fuel_reverse_value = reverseString(buff_fuel);
    const speed_reverse_value = reverseString(buff_speed);
    

   
 

// BELOW VARIABLES ARE CONVERTING REVERSED HEXADECIMAL TO DECIMAL
    const revlatTodec =  hexTodec(revLat);
    const revlognTodec = hexTodec(revLong);
    const accOntimeHextoDec = hexTodec(revAccontime);
    const utc_decimalvalue = hexTodec(utc_reverse_value);
    const mileageTOdecimal = hexTodec(mileage_reverse_value);
    const curMilTodecimal = hexTodec(cur_mil_reverse_value);
    const fuelTodecimal = hexTodec(fuel_reverse_value);
    const speedTodec = hexTodec(speed_reverse_value);


    //ASCII convertion to get DEVICE ID
    const DeviceIDAsci = hexToASCII(deviceId);

    const onlineStatus = false;

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
    const speed = speedCal(speedTodec);


    await PackageModel1.create({ 
        deviceId : DeviceIDAsci , 
        online : onlineStatus,
        coordinates : latLong, 
        utcTime:timestampstoDateUTC, 
         Ontime : timestamptoDateAcc,
         mileage: mileageFinal,
         currenttrip: curentMilfinal,
         FuelConsumption:totalFuel,
         speed: speed,

        });


}


const typeofBuffer = (_buffer) => {



//    var _buffer = "40407700043030303030383632373038303433303732373731100112ad456675ad4566177510005901000059220000070000000400032900000000000001100518063529e558de01ac4db0100e048a0cbf59473353494f4c49554447303732330059473353494f4c4955444730373233000000b1eb0d0a";
    const cmdtype = _buffer.slice(50,54);
    console.log('command type',cmdtype)
    switch (cmdtype){
        case '1001':
            login(_buffer);
         
            break;
        case '1002':
            Offli(_buffer);
        default :
            // disconnected(_buffer)
            console.log('nore')
            break;    
    }

    


//   return res.status(200).send("zsjd")
}


module.exports = {
    typeofBuffer
}