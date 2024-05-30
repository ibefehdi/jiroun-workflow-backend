const Attendance = require('../models/attendanceSchema')
const User = require('../models/userSchema');
const Project = require('../models/projectSchema')

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
        const { latitude, longitude } = req.body;

        // Find all projects
        const projects = await Project.find();

        // Check if the user is within any project's radius
        const projectFound = projects.find(project => {
            const { latitude: siteLat, longitude: siteLong, radius } = project;
            const distance = calculateDistance(latitude, longitude, siteLat, siteLong);
            return distance <= radius;
        });

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