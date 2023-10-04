const express = require('express');
const router = express.Router();
const { getAllUnpaidRequests, completeUnpaidRequests, getPaymentUnpaidRequests, getItemUnpaidRequests,getUnpaidRequestById } = require('../controllers/UnpaidRequestController')

router.get('/unpaidrequests', getAllUnpaidRequests);
router.get('/paymentUnpaid', getPaymentUnpaidRequests);
router.get('/itemUnpaid', getItemUnpaidRequests);
router.post('/unpaidrequests/:id', completeUnpaidRequests);
router.get('/unpaidrequests/:id', getUnpaidRequestById)

module.exports = router;
