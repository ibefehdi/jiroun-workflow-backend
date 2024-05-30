const express = require('express');
const router = express.Router();
const { checkin, checkout, getAllAttendance, checkUserSite } = require('../controllers/attendanceController')

router.get('/attendances', getAllAttendance)

router.post('/checkin', checkin)
router.post('/checkout', checkout)
router.post('/checkusersite', checkUserSite)
module.exports = router;