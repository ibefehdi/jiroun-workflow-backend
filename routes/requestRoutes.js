const express = require('express');
const router = express.Router();
const { getAllRequests,
    getAllRequestsByProjectId,
    getRequestsByApproved,
    getRequestsByAttentionRequired,
    getRequestsByDeclined,
    editRequest,
    createRequest,
    getRequestById,
    getRequestsReceivedByUser,
    getRequestsMadeByUser } = require('../controllers/requestController');

// Get all requests
router.get('/requests', getAllRequests);

// Get all requests by projectId
router.get('/requests/project/:projectId', getAllRequestsByProjectId);

// Get requests by status: Attention Required
router.get('/requests/status/attention', getRequestsByAttentionRequired);

// Get requests by status: Approved
router.get('/requests/status/approved', getRequestsByApproved);

// Get requests by status: Declined
router.get('/requests/status/declined', getRequestsByDeclined);

// Edit a request
router.put('/requests/:requestId', editRequest);

router.get('/requests/:requestId', getRequestById)

// Create a request
router.post('/requests', createRequest);

router.get('/requestsreceivedbyuser/user/:userId', getRequestsReceivedByUser);
router.get('/requestsmadebyuser/user/:userId', getRequestsMadeByUser);

module.exports = router;
