const User = require('../models/userSchema');
const { ContractorWorkRepository, SubContract } = require('../models/contractorWorkRepository');
const Project = require('../models/projectSchema');

const mongoose = require('mongoose');

exports.getAllWorkForContractors = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const workForContractors = await ContractorWorkRepository.find().populate('contractor').populate('subcontracts').skip(skip)
            .limit(resultsPerPage);
        const count = await ContractorWorkRepository.countDocuments();
        res.status(200).json({
            data: workForContractors,
            count: count,
            metadata: {
                total: count
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
}

exports.createSubContract = async (req, res) => {
    const { projectId } = req.params;
    const { name, quantity, unitPrice, contractorId, paidAmount } = req.body;
    console.log(projectId, quantity, unitPrice, contractorId);
    const totalPrice = quantity * unitPrice;
    let percentage = 0;

    try {
        const projectExists = await Project.findOne({ _id: projectId });
        console.log("This is project", projectExists)
        if (!projectExists) {
            return res.status(404).send('Project not found');
        }
        if (paidAmount !== undefined && totalPrice > 0) {
            percentage = (paidAmount / totalPrice) * 100;
        }


        const newSubContract = new SubContract({
            name,
            quantity,
            unitPrice,
            totalPrice,
            percentage,
            paidAmount
        });

        await newSubContract.save();

        // Find the contractor asynchronously
        const contractor = await User.findById({ _id: contractorId });
        console.log(contractorId)
        console.log("this is the contractor", contractor);

        let contractorWorkRepository = await ContractorWorkRepository.findOne({ project: projectId });

        if (!contractorWorkRepository) {
            // Create a new repository if it does not exist
            const contractorWorkRepositoryData = {
                project: projectExists._id,
                subContracts: [newSubContract._id],
                contractor: contractor ? contractor._id : undefined
            };
            contractorWorkRepository = new ContractorWorkRepository(contractorWorkRepositoryData);
            await contractorWorkRepository.save();
        } else {
            // Update the existing repository
            contractorWorkRepository.subContracts.push(newSubContract._id);
            await contractorWorkRepository.save();
        }

        res.status(201).send({ newSubContract, contractorWorkRepository });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
};

exports.editSubContract = async (req, res) => {
    const { subContractId } = req.params;
    const updates = req.body;

    try {
        const subContract = await SubContract.findById(subContractId);
        if (!subContract) {
            return res.status(404).send('SubContract not found');
        }

        Object.keys(updates).forEach((updateField) => {
            subContract[updateField] = updates[updateField];
        });

        // Recalculate totalPrice if necessary
        if (updates.quantity || updates.unitPrice) {
            subContract.totalPrice = subContract.quantity * subContract.unitPrice;
        }

        // Automatically update percentage if paidAmount is provided
        if (updates.paidAmount !== undefined && subContract.totalPrice > 0) {
            subContract.percentage = (updates.paidAmount / subContract.totalPrice) * 100;
        }

        await subContract.save();

        res.status(200).send(subContract);
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
};



exports.getSubContractsForProject = async (req, res) => {
    const { projectId } = req.params; // Assuming you're passing the project ID in the URL

    try {
        // Find the project with the given ID and populate subcontracts
        const project = await ContractorWorkRepository.findOne({ project: projectId })
            .populate({
                path: 'subContracts',
                populate: {
                    path: 'contractor',
                    model: 'User'
                }
            });

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Extracting subcontracts from the project
        const subContracts = project.subContracts;

        res.status(200).send(subContracts);
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
};
exports.getSubContractsForProjectCount = async (req, res) => {
    const { projectId } = req.params; // Assuming you're passing the project ID in the URL
    console.log(projectId);
    try {
        // Find the project with the given ID and populate subcontracts
        const project = await ContractorWorkRepository.findOne({ project: projectId });
        console.log(project);
        if (!project) {
            return res.status(404).sendStatus('Project not found');
        }


        const subContracts = project.subContracts.length;

        res.status(200).send({ count: subContracts });
    } catch (error) {
        res.status(500).sendStatus('Server error: ' + error.message);
    }
};
exports.getSubContractsForContractor = async (req, res) => {
    try {
        const { contractorId, subcontractId } = req.params;
        console.log("contractor Id", contractorId);
        console.log("Sub contract Id", subcontractId);
        // Find the subcontract with the given subcontractId and contractorId
        const subcontract = await SubContract.findOne({
            _id: subcontractId,

        }).populate('contractor');
        console.log(subcontract)
        if (!subcontract) {
            return res.status(404).send('Subcontract not found');
        }

        res.json(subcontract);
    } catch (error) {
        res.status(500).send('Server error');
    }
};