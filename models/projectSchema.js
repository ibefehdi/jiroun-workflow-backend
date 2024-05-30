const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: { type: String, required: true, unique: true },
    year: { type: Date, required: true },
    location: { type: String, required: true },
    contractors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    foremen: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    projectManager: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    projectDirector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    latitude: Number,
    longitude: Number,
    radius: Number,
    // shiftStart: String, 
    // shiftEnd: String, 
})

module.exports = mongoose.model('Project', projectSchema);