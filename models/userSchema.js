const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String },
    phoneNo: { type: String },
    fName: { type: String, required: true },
    lName: { type: String, required: true },
    occupation: { type: String, required: true },
    hasChangedPassword: { type: Boolean, default: false },
    superAdmin: { type: Boolean, required: true },     // The superAdmin property is required and must be a boolean. Only difference is that a superAdmin can add new users to the database.
    password: { type: String, required: true },

});

module.exports = mongoose.model('User', userSchema);