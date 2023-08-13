const express = require('express');
const router = express.Router();
const {
    getAllRequests,
    getRequestsByProjectId,
    getPendingRequests,
    getApprovedRequests,
    getDeclinedRequests,
    createSubRequest,
    createRequest,
    getRequestById,
    getRequestBySender,
    getRequestByReceiver,
    editSubRequest,
    editRequest,
    checkRecipient,
    getRequestsCount,
    deleteRequest,
    editRequestItems
} = require('../controllers/requestController');

// Get all requests
router.get('/requests', getAllRequests);

// Get all requests by projectId
router.get('/requests/project/:projectId', getRequestsByProjectId);

// Get requests by status: Attention Required
router.get('/requests/status/attention', getPendingRequests);

// Get requests by status: Approved
router.get('/requests/status/approved', getApprovedRequests);

// Get requests by status: Declined
router.get('/requests/status/declined', getDeclinedRequests);

router.post('/requests/:requestId', createSubRequest)

router.get('/requests/:id', getRequestById)

// Create a request
router.post('/requests', createRequest);
router.get('/requests/sender/:userId', getRequestBySender);
router.get('/requests/receiver/:userId', getRequestByReceiver)
router.put('/subrequests/:subrequestId', editSubRequest)
router.put('/requests/:requestId', editRequest)
router.get('/checkRecipient/:userId/:requestId', checkRecipient);
router.put('/editrequests/:requestId', editRequestItems)
router.get('/requestscount/', getRequestsCount);

router.post('/deleteRequest/:id', deleteRequest);
module.exports = router;
