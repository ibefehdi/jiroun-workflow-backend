const mongoose = require('mongoose');
const Notification = require('../models/notificationsSchema');

exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await Notification.find({ user: userId });
        res.json(notifications);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.editReadNotifications = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
        res.json(notification);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
