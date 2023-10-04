const express = require('express');
const { getAllCompletedRequests, getCompletedRequestById } = require('../controllers/completeRequestController');
const router = express.Router();

router.get('/completedrequests', getAllCompletedRequests)
router.get('/completedRequest/:id', getCompletedRequestById)

module.exports = router;
