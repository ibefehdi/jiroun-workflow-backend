const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
    stepNumber: { type: Number, required: true },
    role: { type: String, required: true }, // e.g., 'Project Manager', 'Finance'
    actionRequired: { type: String }, // e.g., 'Approve', 'Review'
});

const workflowSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., 'Request Payment Workflow'
    requestType: { type: String, required: true }, // e.g., 'Request Payment'
    steps: [workflowStepSchema],
});

// const Workflow = mongoose.model('Workflow', workflowSchema);
module.exports = mongoose.model('Workflow', workflowSchema);