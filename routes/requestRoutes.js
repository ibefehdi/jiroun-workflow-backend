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
    editRequestItems,
    getAllSendersInRequest,
    createCompleteRequest,
    createUnpaidRequest,
    getSendersFromSubRequests,
    getRequestByReceiverCount,
    editContractorinRequest
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

router.get('/getAllSenders/:id', getSendersFromSubRequests)
// Create a request
router.post('/requests', createRequest);
router.get('/requests/sender/:userId', getRequestBySender);
router.get('/requests/receiver/:userId', getRequestByReceiver)
router.get('/requests/receiverCount/:userId', getRequestByReceiverCount)

router.put('/subrequests/:subrequestId', editSubRequest)
router.put('/requests/:requestId', editRequest)
router.put('/requests/contractor/:requestId',editContractorinRequest)
router.get('/checkRecipient/:userId/:requestId', checkRecipient);
router.put('/editrequests/:requestId', editRequestItems)
router.get('/requestscount/', getRequestsCount);
router.get('/getSenders/:id', getAllSendersInRequest)
router.post('/deleteRequest/:id', deleteRequest);
router.post('/createRequest/:id', createRequest);
router.post('/completeRequest/request/:id', createCompleteRequest)
router.post('/unpaidrequest/request/:id', createUnpaidRequest)
module.exports = router;
