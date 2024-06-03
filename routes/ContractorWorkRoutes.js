const express = require('express');
const { getAllWorkForContractors, createSubContract, getSubContractsForProject, getSubContractsForContractor, getSubContractsForProjectCount, editSubContract } = require('../controllers/contractorWorkRepositoryController')
const router = express.Router();

router.get('/getallcontractorwork', getAllWorkForContractors);
router.post('/createsubcontract/:projectId', createSubContract);
router.get('/subcontractsbyproject/:projectId', getSubContractsForProject)
router.get('/subcontract/:contractorId/:subcontractId', getSubContractsForContractor)
router.get('/subcontractsperproject/:projectId', getSubContractsForProjectCount)
router.patch('/subcontract/:subContractId', editSubContract);
module.exports = router;