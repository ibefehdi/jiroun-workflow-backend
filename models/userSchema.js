const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName:{String, required: true},
    fName:{String, required: true},
    lName:{String, required: true},
    Occupation:{String, required: true},
    superAdmin:{Boolean, required: true},
    password:{String, required: true}
})