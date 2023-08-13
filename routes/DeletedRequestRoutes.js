const express = require('express');
const { getAllDeletedRequests } = require('../controllers/DeletedRequestController');
const router = express.Router();

router.get('/deletedrequests', getAllDeletedRequests)

module.exports = router;
