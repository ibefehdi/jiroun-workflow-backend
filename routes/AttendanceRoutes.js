const express = require('express');
const router = express.Router();
const { checkin, checkout, getAllAttendance, checkUserSite, getAttendanceByUser, getAllAttendanceByDay, getMonthlyAttendanceReport, getUserAttendanceForDay } = require('../controllers/attendanceController')

router.get('/attendances', getAllAttendance)
router.get('/attendanceperuser/:userId', getAttendanceByUser)
router.get('/attendanceperday/', getAllAttendanceByDay)
router.get('/getmonthlyreport', getMonthlyAttendanceReport)
router.get('/user-attendance-for-day', getUserAttendanceForDay)
router.post('/checkin', checkin)
router.post('/checkout', checkout)
router.post('/checkusersite', checkUserSite)
module.exports = router;