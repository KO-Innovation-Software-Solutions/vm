const ObdyFormulaModel = require('../../models/obdformula');


const insert = async (req,res) => {
    try {
        let response = await ObdyFormulaModel.create(req.body);
        return res.status(200).send(response);
    } catch (error) {
        return res.status(403).send(error)
    }
}
// query for listing formulas
const list = async (req, res) => {
    try {
        
        let response = await ObdyFormulaModel.find();
        return res.status(200).send(response);

    } catch (error) {

        console.log(error);
        return res.status(403).send(error)
        
    }
}

// query for getting formulas by ID
const getFormulaByID = async (req, res) => {
    try {
        const formula = await ObdyFormulaModel.findById(req.params._id);
        if (!formula) {
            return res.status(404).send({ message: 'Formula not found' });
        }
        res.send(formula);

    } catch (error) {
        console.log(error);
        return res.status(403).send(error)
    }
}

const update = async (req, res) => {
    try {

        const { _id, formula } = req.body;

        // Fetch the document to check existing formulas
        const document = await ObdyFormulaModel.findById(_id);

        if (!document) {
            return res.status(404).send({ message: 'Document not found' });
        }

        formula.forEach((newItem) => {
            const existingItem = document.formula.id(newItem._id);
            if (existingItem) {
                // Update existing item
                existingItem.parameter = newItem.parameter;
                existingItem.calibrationFormula = newItem.calibrationFormula;
            } else {
                // Add new item
                document.formula.push(newItem);
            }
        });

        await document.save();
        return res.status(200).send(document);
        
    } catch (error) {
        console.log(error);
        return res.status(403).send(error)
    }
}

module.exports = {
    insert,
    list,
    getFormulaByID,
    update

}