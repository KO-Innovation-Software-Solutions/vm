const Alarm_packageModel  = require('../../models/alarmpackage');





const insert = async (req,res) => {
    try {
        let response = await Alarm_packageModel.create(req.body);
        return res.status(200).send(response);
    } catch (error) {
        return res.status(403).send(error)
    }
}


module.exports = {
    insert,

}