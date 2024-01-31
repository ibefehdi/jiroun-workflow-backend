const express = require('express');
const { getAllCompletedRequests, getCompletedRequestById, createCompleteRequest } = require('../controllers/completeRequestController');
const router = express.Router();

router.get('/completedrequests', getAllCompletedRequests)
router.get('/completedRequest/:id', getCompletedRequestById)
router.post('/completeRequest/:id', createCompleteRequest)
module.exports = router;
