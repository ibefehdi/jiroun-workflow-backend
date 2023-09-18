const express = require('express');
const router = express.Router();
const { getAllNotifications, editReadNotifications } = require('../controllers/noticationController')

router.get('/notifications/:userId', getAllNotifications);

router.put('/notifications/:id/read', editReadNotifications);

module.exports = router;