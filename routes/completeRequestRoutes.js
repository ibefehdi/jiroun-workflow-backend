const express = require('express');
const { createCompleteRequest } = require('../controllers/completeRequestController');
const router = express.Router();


router.post('/completeRequest', createCompleteRequest);

module.exports = router;
