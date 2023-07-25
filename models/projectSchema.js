const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectName: { String, required: true },
    year: { Date, required: true },
    location: { String, required: true },
    contractors:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }],
    projectManager:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    projectDirector:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }
})

module.exports = mongoose.model('Project',projectSchema);