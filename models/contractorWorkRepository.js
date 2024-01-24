const mongoose = require('mongoose');

const subContractSchema = new mongoose.Schema({
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'ContractorWorkRepository' },
    name: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    paidAmount: Number,
    percentage: Number,
});

const SubContract = mongoose.model('SubContract', subContractSchema);

const contractorWorkRepositorySchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subContracts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubContract' }],
});
const ContractorWorkRepository = mongoose.model('ContractorWorkRepository', contractorWorkRepositorySchema);

module.exports.SubContract = SubContract
module.exports.ContractorWorkRepository = ContractorWorkRepository