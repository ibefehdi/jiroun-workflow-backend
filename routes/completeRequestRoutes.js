const express = require('express');
const { getAllCompletedRequests, getCompletedRequestById, createCompleteRequest, completeUnpaidItemRequests, completeRequestsLazy } = require('../controllers/completeRequestController');
const router = express.Router();

router.get('/completedrequests', getAllCompletedRequests)
router.get('/completedRequest/:id', getCompletedRequestById)
router.post('/completeRequest/:id', createCompleteRequest)
router.get('/finishItemsUnpaid', completeUnpaidItemRequests)
router.post('/completerequestlazy', completeRequestsLazy)
module.exports = router;
