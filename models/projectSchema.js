const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    year: { type: Date, required: true },
    location: { type: String, required: true },
    contractors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],                                             //TODO: Make separate endpoints for the contractors so that they cannot acces other projects
    projectManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    projectDirector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
})

module.exports = mongoose.model('Project', projectSchema);