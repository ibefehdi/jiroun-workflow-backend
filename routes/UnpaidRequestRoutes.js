const express = require('express');
const router = express.Router();
const { getAllUnpaidRequests, completeUnpaidRequests, getPaymentUnpaidRequests, getItemUnpaidRequests, getUnpaidRequestById, getLabourUnpaidRequests, completeAllUnpaidItemRequests } = require('../controllers/UnpaidRequestController')

router.get('/unpaidrequests', getAllUnpaidRequests);
router.get('/paymentUnpaid', getPaymentUnpaidRequests);
router.get('/itemUnpaid', getItemUnpaidRequests);
router.get('/labourUnpaid', getLabourUnpaidRequests);
router.post('/unpaidrequests/:id', completeUnpaidRequests);
router.get('/unpaidrequests/:id', getUnpaidRequestById)
router.get('/finishItemsUnpaid', completeAllUnpaidItemRequests)
module.exports = router;
