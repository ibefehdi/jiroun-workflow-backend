const express = require('express');
const { createCompleteRequest, getAllCompleteRequests, getByProjectId, getByRecipient, getByRequestIdInAllRequests, getBySender } = require('../controllers/completeRequestController');
const router = express.Router();


router.get('/completeRequest', getAllCompleteRequests)
router.get('/completeRequest/project/:projectId', getByProjectId)
router.get('/completeRequest/:recipient', getByRecipient)
router.get('/completeRequest/allrequests/:projectId', getByRequestIdInAllRequests);
router.get('/completeRequest/:sender', getBySender);
router.post('/completeRequest', createCompleteRequest);

module.exports = router;
