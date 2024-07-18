const Attendance = require('../models/attendanceSchema')
const User = require('../models/userSchema');
const Project = require('../models/projectSchema')
const AttendanceLog = require('../models/attendanceLog');

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 * 1000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
exports.getAttendanceByDate = async (req, res) => {
    try {
        const date = req.query.date;

        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const attendances = await Attendance.find({
            checkIn: { $gte: startDate, $lte: endDate },
        }).populate('userId', 'fName lName');

        const userAttendanceMap = new Map();

        attendances.forEach((attendance) => {
            const userId = attendance.userId._id.toString();
            const user = {
                fName: attendance.userId.fName,
                lName: attendance.userId.lName,
            };

            if (!userAttendanceMap.has(userId)) {
                userAttendanceMap.set(userId, {
                    user,
                    sites: new Set(),
                    totalWorkingHours: 0,
                    checkIns: [],
                    checkOuts: [],
                });
            }

            const userAttendance = userAttendanceMap.get(userId);
            userAttendance.sites.add(attendance.siteId.toString());
            userAttendance.totalWorkingHours += parseFloat(attendance.workingHours);
            userAttendance.checkIns.push(attendance.checkIn);

            if (attendance.checkOut) {
                userAttendance.checkOuts.push(attendance.checkOut);
            }
        });

        const result = Array.from(userAttendanceMap.values()).map((userAttendance) => ({
            user: userAttendance.user,
            numberOfSites: userAttendance.sites.size,
            totalWorkingHours: userAttendance.totalWorkingHours,
            checkIns: userAttendance.checkIns,
            checkOuts: userAttendance.checkOuts,
        }));

        res.status(200).json({
            data: result,
            count: result.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAllAttendance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const attendances = await Attendance.find()
            .populate('userId', 'fName lName')
            .populate('siteId', 'projectName location latitude longitude radius')
            .skip(skip)
            .limit(limit);

        const count = await Attendance.countDocuments();

        res.status(200).json({
            data: attendances,
            count: attendances.length,
            metadata: {
                total: count,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAllAttendanceByDay = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const date = req.query.date; // Get the date from query params

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        // Create Date objects for the start and end of the specified day
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const pipeline = [
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'sites',
                    localField: 'siteId',
                    foreignField: '_id',
                    as: 'site'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $unwind: '$site'
            },
            {
                $group: {
                    _id: "$userId",
                    fName: { $first: "$user.fName" },
                    lName: { $first: "$user.lName" },
                    projectName: { $first: "$site.projectName" },
                    location: { $first: "$site.location" },
                    latitude: { $first: "$site.latitude" },
                    longitude: { $first: "$site.longitude" },
                    radius: { $first: "$site.radius" },
                    firstCheckIn: { $min: "$checkIn" },
                    lastCheckOut: { $max: "$checkOut" }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ];

        const attendances = await Attendance.aggregate(pipeline);

        const countPipeline = [
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$userId"
                }
            },
            {
                $count: "total"
            }
        ];

        const countResult = await Attendance.aggregate(countPipeline);
        const count = countResult.length > 0 ? countResult[0].total : 0;

        res.status(200).json({
            data: attendances,
            count: attendances.length,
            metadata: {
                total: count,
                date: date
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getMonthlyAttendanceReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ error: 'Year and month parameters are required' });
        }

        // Create Date objects for the start and end of the specified month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const pipeline = [
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $group: {
                    _id: {
                        userId: "$userId",
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                    },
                    fName: { $first: "$user.fName" },
                    lName: { $first: "$user.lName" },
                    firstCheckIn: { $min: "$checkIn" },
                    lastCheckOut: { $max: "$checkOut" },
                    totalWorkDuration: {
                        $sum: {
                            $subtract: [
                                { $ifNull: ["$checkOut", new Date()] },
                                "$checkIn"
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.userId",
                    fName: { $first: "$fName" },
                    lName: { $first: "$lName" },
                    daysWorked: { $sum: 1 },
                    totalWorkDuration: { $sum: "$totalWorkDuration" },
                    avgDailyWorkDuration: { $avg: "$totalWorkDuration" },
                    earliestCheckIn: { $min: "$firstCheckIn" },
                    latestCheckOut: { $max: "$lastCheckOut" }
                }
            },
            {
                $project: {
                    fName: 1,
                    lName: 1,
                    daysWorked: 1,
                    totalWorkDuration: { $divide: ["$totalWorkDuration", 3600000] }, // Convert to hours
                    avgDailyWorkDuration: { $divide: ["$avgDailyWorkDuration", 3600000] }, // Convert to hours
                    earliestCheckIn: 1,
                    latestCheckOut: 1
                }
            },
            {
                $sort: { lastName: 1, firstName: 1 }
            }
        ];

        const monthlyReport = await Attendance.aggregate(pipeline);

        // Calculate overall statistics
        const overallStats = monthlyReport.reduce((acc, curr) => {
            acc.totalEmployees++;
            acc.totalDaysWorked += curr.daysWorked;
            acc.totalWorkDuration += curr.totalWorkDuration;
            return acc;
        }, { totalEmployees: 0, totalDaysWorked: 0, totalWorkDuration: 0 });

        overallStats.avgDaysWorked = overallStats.totalDaysWorked / overallStats.totalEmployees;
        overallStats.avgWorkDuration = overallStats.totalWorkDuration / overallStats.totalEmployees;

        res.status(200).json({
            month: `${year}-${month.padStart(2, '0')}`,
            overallStats,
            employeeReports: monthlyReport
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.checkin = async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;

        // Find all projects
        const projects = await Project.find();

        // Check if the user is within any project's radius
        const projectFound = projects.find(project => {
            const { latitude: siteLat, longitude: siteLong, radius } = project;
            const distance = calculateDistance(latitude, longitude, siteLat, siteLong);
            return distance <= radius;
        });

        console.log("Project: ", projectFound);

        // Create an attendance log
        const attendanceLog = new AttendanceLog({
            userId,
            latitude,
            longitude,
            projectId: projectFound ? projectFound._id : null,
            isOnsite: !!projectFound,
        });

        await attendanceLog.save();

        if (!projectFound) {
            console.log('You are not on any site');
            return res.status(400).json({ message: 'You are not on any site' });
        }

        // Check if a check-in exists for the same day without a check-out
        const today = new Date().setHours(0, 0, 0, 0);
        const existingAttendance = await Attendance.findOne({
            userId,
            siteId: projectFound._id,
            checkIn: { $gte: today },
            checkOut: null
        });

        if (existingAttendance) {
            console.log('Check-in already exists for today');
            return res.status(400).json({ message: 'Check-in already exists for today' });
        }

        // Create a new attendance record
        const attendance = new Attendance({
            userId,
            siteId: projectFound._id,
            checkIn: new Date(),
        });

        await attendance.save();

        res.status(201).json({ message: 'Check-in successful', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.checkout = async (req, res) => {
    try {
        const { userId, latitude, longitude } = req.body;
        const projects = await Project.find();

        // Check if the user is within any project's radius
        const projectFound = projects.find(project => {
            const { latitude: siteLat, longitude: siteLong, radius } = project;
            const distance = calculateDistance(latitude, longitude, siteLat, siteLong);
            return distance <= radius;
        });

        console.log(projectFound._id);
        console.log(userId);

        // Create an attendance log
        const attendanceLog = new AttendanceLog({
            userId,
            latitude,
            longitude,
            projectId: projectFound ? projectFound._id : null,
            isOnsite: !!projectFound,
        });

        await attendanceLog.save();

        const attendance = await Attendance.findOne({ userId, siteId: projectFound._id, checkOut: null }).sort({ checkIn: -1 });

        if (!attendance) {
            return res.status(404).json({ message: 'No active check-in found' });
        }

        // Update the attendance record with the check-out time
        attendance.checkOut = new Date();

        // Calculate the working hours
        const checkInTime = attendance.checkIn;
        const checkOutTime = attendance.checkOut;
        const workingMilliseconds = checkOutTime - checkInTime;
        const workingSeconds = Math.floor(workingMilliseconds / 1000);

        const hours = Math.floor(workingSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((workingSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = (workingSeconds % 60).toString().padStart(2, '0');
        const workingHours = `${hours}:${minutes}:${seconds}`;

        attendance.workingHours = workingHours;

        await attendance.save();

        res.status(200).json({ message: 'Check-out successful', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.checkUserSite = async (req, res) => {
    try {
        // Extract latitude, longitude, and userId from request payload
        const { latitude, longitude, userId } = req.body;
        console.log(latitude, longitude, userId);

        // Find all projects
        const projects = await Project.find();

        // Check if the user is within any project's radius
        const projectFound = projects.find(project => {
            const { latitude: siteLat, longitude: siteLong, radius } = project;
            const distance = calculateDistance(latitude, longitude, siteLat, siteLong);
            console.log(distance);
            return distance <= radius;
        });

        // Create an attendance log
        const attendanceLog = new AttendanceLog({
            userId,
            latitude,
            longitude,
            projectId: projectFound ? projectFound._id : null,
            isOnsite: !!projectFound,
        });

        // Save the attendance log
        await attendanceLog.save();

        if (!projectFound) {
            return res.status(200).json({
                siteName: "",
                isCurrentlyOnsite: false,
                siteId: "",
            });
        }

        // Return site name and onsite status
        res.status(200).json({
            siteName: projectFound.projectName,
            isCurrentlyOnsite: true,
            siteId: projectFound._id,
        });
    } catch (err) {
        // Handle any errors
        res.status(500).json({ message: err.message });
    }
};

exports.getAttendanceByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all attendance records for the specified user
        const attendanceRecords = await Attendance.find({ userId })
            .populate('siteId', 'projectName') // Populate the site name
            .sort({ checkIn: -1 }); // Sort by check-in time in descending order

        // Calculate total working hours for the user
        const totalWorkingHours = attendanceRecords.reduce((total, record) => {
            const workingHours = parseFloat(record.workingHours);
            return total + (isNaN(workingHours) ? 0 : workingHours);
        }, 0);

        res.status(200).json({
            user: user.fName + ' ' + user.lName,
            totalWorkingHours,
            attendanceRecords,
        });
    } catch (error) {
        console.error('Error retrieving attendance by user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};