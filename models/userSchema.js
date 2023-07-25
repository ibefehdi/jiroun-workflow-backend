const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {type: String, required: true },
    fName: {type: String, required: true },
    lName: { type:String, required: true },
    occupation: {type: String, required: true },
    superAdmin: {type: Boolean, required: true },     // The superAdmin property is required and must be a boolean. Only difference is that a superAdmin can add new users to the database.
    password: {type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);