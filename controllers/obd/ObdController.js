
const ObdyModel = require('../../models/obdsetting');
const Obdfunction = require('../../models/odbfunctions');



const insert = async (req,res) => {
    try {
        let response = await ObdyModel.create(req.body);
        return res.status(200).send(response);
    } catch (error) {
        return res.status(403).send(error)
    }
}

const update = async (req,res) => {
    try {
        let _id = req.params.id;
        let response = await ObdyModel.findByIdAndUpdate(_id,req.body);
        return res.status(200).send(response);
    } catch (error) {
        return res.status(403).send(error)
    }
}

const list = async (req,res) => {
    try {
        let total = 10;
        let page = req.query.page || 0;
        // let response = await ObdyModel.find().skip(total * parseInt(page)).limit(total);
        let response = await ObdyModel.find();
        return res.status(200).send(response);
    } catch (error) {
        return res.status(403).send(error)
    }
}


const get = async (req, res) => {
    try {

        let _listId = req.params.id;
        let response = await ObdyModel.findById(_listId);
        return res.status(200).send(response);
        
    } catch (error) {
        return res.status(403).send(error)
    }
}

// const updatePackageSplitter = async (req, res) => { 
//     try {
//         const { _id, packageid } = req.params;
//         const { packageSplitters } = req.body;

//         for (const ps of packageSplitters) {
//             if (!ps._id) {     
//                 delete ps._id;
//                 await ObdyModel.updateOne(
//                     { _id, "package._id": packageid },
//                     { $push: { "package.$.package_splitter": ps } }
//                 );     
//             } else {
//                 await ObdyModel.updateOne(
//                     { _id, "package._id": packageid },
//                     { 
//                         $set: { "package.$[pkg].package_splitter.$[splitter]": ps } 
//                     },
//                     {
//                         arrayFilters: [
//                             { "pkg._id": packageid },
//                             { "splitter._id": ps._id }
//                         ]
//                     }
//                 );
//             }
//         }

//         return res.status(200).send('Package splitter updated successfully');
//     } catch (error) {
//         console.log(error);
//         return res.status(403).send(error);
//     }
// };

// query for updating package splitter using deviceid and package id
const updatePackageSplitter = async (req, res) => { 
    try {

        const { _id , packageid  } = req.params;
        const { packageSplitters } = req.body;
        const { packageIndex, splitterData } = req.body;
        console.log('mmmmmmmHHHHHmmmmmmmm', packageSplitters);

        for await(const ps of packageSplitters){
            
            let obj = {};
            if(ps._id == ""){     
                delete ps._id;
                await ObdyModel.updateOne({
                    _id : _id,
                    "package._id" : packageid
                },{ $push : {
                    "package.$.package_splitter" : ps
                    }
                })  ;     
            } else {
                await ObdyModel.updateOne({
                    _id : _id,
                   "package._id": packageid
                },{ $set : {
                    "package.$[package].package_splitter.$[packagesplitter]" : ps
                    }
                }, {
                    arrayFilters: [
                      { "package._id": packageid },
                      { "packagesplitter._id": ps._id }
                    ]
                  })  ;
            }

           
        }
        // const updateData =  await ObdyModel.findOneAndUpdate({
        //     _id : _id,
        //      "package.id" : packageid
        // },{
        //     $push : {
        //         package_splitter : package_splitter
        //     }
        // });
  
        return res.status(200).send('Package splitter updated successfully');
    } catch (error) {
        console.log(error);
        return res.status(403).send(error)

    }
}
// query for deleting package splitter using deviceid and package id and selected package splitter id

const deletePackageSplitter = async (req, res) => {
    try {
        const { _id, packageid, packageSplitterId } = req.params;
       
        console.log(_id, packageid, packageSplitterId);

        // Update the document to remove the specific package splitter
        const updateData = await ObdyModel.updateOne(
            { _id: _id, 'package._id': packageid },
            {
                $pull: {
                    'package.$.package_splitter': { _id: packageSplitterId }
                }
            }
        );
  
        if (updateData.nModified === 0) {
            return res.status(404).json({ message: 'Package splitter not found' });
        }
  
        return res.status(200).json({ message: 'Package splitter deleted successfully' });
        
    } catch (error) {
        console.log(error);
        return res.status(403).send(error);
    }
}

// query for geting package splitter using deviceid and package id

const getPackageSplitter = async (req, res) => { 
    try {

        const { _id , packageid  } = req.params;
      
        const updateData =  await ObdyModel.find({
            _id : _id,
             "package._id" : packageid
        });
        return res.status(200).send(updateData);
    } catch (error) {
        return res.status(403).send(error)

    }
}

const _delete = async (req,res) => {
    try {
        let id = req.params.id;
        let response = await ObdyModel.findByIdAndDelete(id);
        return res.status(200).send(response);
    } catch (error) {
        console.log('sssssssss',error);
        return res.status(403).send(error)
        
    }
}


const storefunctions = async(req,res) => {
    try {

    await Obdfunction.deleteMany({});

       await Obdfunction.insertMany([
        {
            name : "Coordinates",
            calculation : `return parseInt(shortbuffer.split(/(..)/g).reverse().join(""),16)/3600000`
        },{
            name : "Milege",
            calculation : `return parseInt(shortbuffer.split(/(..)/g).reverse().join(""),16).toString()/1000`
        },
        {
            name : "Timing",
            calculation : `return  new Date(parseInt(shortbuffer.split(/(..)/g).reverse().join(""),16).toString() * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })`
        },
        {
            name : "Fuel",
            calculation : `return parseInt(shortbuffer.split(/(..)/g).reverse().join(""),16).toString() * 0.01`
        },{
             name : "Speed",
            calculation : `return parseInt(shortbuffer.split(/(..)/g).reverse().join(""),16).toString() * 0.036`
        },
        {
            name : "DeviceId",
           calculation : `return Array.from({ length: shortbuffer.toString().length / 2 }, (_, i) => String.fromCharCode(parseInt(shortbuffer.toString().substring(i * 2, i * 2 + 2), 16))).join('')`
       },
        
         
       ]);
       return res.status(200).send('success')
        
    } catch (error) {
        return res.status(403).send(error)
    }
}



const checkfunction = async(req,res) => {
    try {
        let buff = "4040770004303030303038363237303830343330373237373110010000000091097c666cf4130000000000582900000000000000000000000000000000011a06180c1d0546524e02b4cee2100000b2000359473353494f4c49554447303732330059473353494f4c49554447303732330000006a900d0a";
        let response = await ObdyModel.findById("667c3c402ad4b2ff7dfd93d3"); // from api
      
        let selectpackage =  response?.package?.filter(r=> {
            const splitpackage = buff.slice(parseInt(r.command_name),parseInt(r.command_length));
           if(r.command_type == splitpackage){
            return r;
           }
        });

        let obj = {};
        for await(const ps of selectpackage[0].package_splitter){
     
                if(ps.setFormat){
                    let splitter = buff.slice(parseInt(ps.start),parseInt(ps.end));
                    let decode = ps.formatValues;
                    
                    let coordinates =  await Obdfunction.findOne({ name : decode }).lean(); 

                    console.log(coordinates)
                }
                

        }

        console.log(selectpackage);
     //  console.log(package.data)

        // let coordinates =  await Obdfunction.findOne({ name : "Timing" }).lean();
        // const fn = new Function('shortbuffer', coordinates.calculation);
        // const result = fn.apply(null, ["95af4566"]);
        // console.log(result);
        // return  res.status(200).send(result.toString() );

        return res.status(200).send(selectpackage)

    } catch (error) {
        return res.status(403).send(error)
    }
}

module.exports = {
    insert,
    update,
    list,
    _delete,
    get,
    updatePackageSplitter,
    getPackageSplitter,
    deletePackageSplitter,
    storefunctions,
    checkfunction
}

