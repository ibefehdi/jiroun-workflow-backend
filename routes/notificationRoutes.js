const express = require('express');
const router = express.Router();
const { getAllNotifications, editReadNotifications } = require('../controllers/noticationController')

router.get('/notifications/:userId', getAllNotifications);

router.patch('/notifications/:id/read', editReadNotifications);

module.exports = router;