const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: { String, required: true },
    fName: { String, required: true },
    lName: { String, required: true },
    occupation: { String, required: true },
    superAdmin: { Boolean, required: true },     // The superAdmin property is required and must be a boolean. Only difference is that a superAdmin can add new users to the database.
    password: { String, required: true }
});

module.exports = mongoose.Model('User', userSchema);