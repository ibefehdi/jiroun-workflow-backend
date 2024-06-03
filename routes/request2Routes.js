const express = require('express');
const router = express.Router();
const {
    getAllRequestsByProjectId,
    getRequestsByApproved,
    getRequestsByAttentionRequired,
    getRequestsByDeclined,
    editRequest,
    createRequest,
    getRequestsCount,
    getRequestsByReceiver,
    getRequestsBySender,
    getRequestById } = require('../controllers/request2Controller');



// Get all requests by projectId
router.get('/requests/:projectId', getAllRequestsByProjectId);
router.get('/requestscount/', getRequestsCount)
// Get requests by status: Attention Required
router.get('/requests/status/attention', getRequestsByAttentionRequired);

// Get requests by status: Approved
router.get('/requests/status/approved', getRequestsByApproved);

// Get requests by status: Declined
router.get('/requests/status/declined', getRequestsByDeclined);

// Edit a request
router.patch('/requests/:requestId', editRequest);

router.get('/requestsbyId/:requestId', getRequestById)

// Create a request
router.post('/requests', createRequest);

router.get('/requestsreceivedbyuser/user/:userId', getRequestsByReceiver);
router.get('/requestsmadebyuser/user/:userId', getRequestsBySender);

module.exports = router;
