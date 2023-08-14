const express = require('express');
const { getAllCompletedRequests } = require('../controllers/completeRequestController');
const router = express.Router();

router.get('/completedrequests', getAllCompletedRequests)

module.exports = router;
