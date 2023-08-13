const express = require('express');
const { getAllDeletedRequests, getRequestById, getDeletedRequestCount } = require('../controllers/DeletedRequestController');
const router = express.Router();

router.get('/deletedrequests', getAllDeletedRequests)
router.get('/deletedrequests/:id', getRequestById)
router.get('/deletedrequestscount/', getDeletedRequestCount);
module.exports = router;
